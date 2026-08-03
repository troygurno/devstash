/**
 * Database smoke test — connectivity, seed state, constraints, and a full CRUD
 * round-trip. Run with `npm run db:test`.
 *
 * Writes to whatever DATABASE_URL points at, so keep it on the Neon **dev** branch.
 * Everything it creates hangs off one throwaway user that is deleted at both ends of
 * the run, so a crash mid-test doesn't leave residue for the next one.
 */
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../src/generated/prisma/client";

const TEST_EMAIL = "db-smoke-test@devstash.local";
const EXPECTED_SYSTEM_TYPES = 7;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

let failures = 0;

function check(label: string, passed: boolean, detail = "") {
  const mark = passed ? "PASS" : "FAIL";
  if (!passed) failures++;
  console.log(`  [${mark}] ${label}${detail ? ` — ${detail}` : ""}`);
}

async function removeTestUser() {
  // Cascades to items, collections, and tags.
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — check .env against .env.example");
  }

  console.log("\nConnection");
  const [{ now }] = await prisma.$queryRaw<[{ now: Date }]>`SELECT now() as now`;
  check("reached the database", Boolean(now), now?.toISOString());

  console.log("\nSeed data");
  const systemTypes = await prisma.itemType.findMany({
    where: { isSystem: true },
    orderBy: { sortOrder: "asc" },
  });
  check(
    `${EXPECTED_SYSTEM_TYPES} system item types`,
    systemTypes.length === EXPECTED_SYSTEM_TYPES,
    `found ${systemTypes.length}`,
  );
  check(
    "all system types are unowned",
    systemTypes.every((type) => type.userId === null),
  );
  check(
    "slugs match the spec",
    systemTypes.map((t) => t.slug).join(",") ===
      "snippets,prompts,commands,notes,links,files,images",
    systemTypes.map((t) => t.slug).join(","),
  );

  console.log("\nConstraints");
  // @@unique([userId, slug]) can't catch this — Postgres treats NULL as distinct,
  // so the partial unique index from the second migration has to.
  let duplicateRejected = false;
  try {
    await prisma.itemType.create({
      data: {
        name: "Duplicate",
        slug: "snippets",
        icon: "Code",
        color: "#000000",
        isSystem: true,
        userId: null,
      },
    });
    await prisma.itemType.deleteMany({ where: { name: "Duplicate" } });
  } catch {
    duplicateRejected = true;
  }
  check("duplicate system slug rejected", duplicateRejected);

  console.log("\nCRUD round-trip");
  await removeTestUser();

  const snippetType = systemTypes.find((type) => type.slug === "snippets");
  if (!snippetType) throw new Error("snippets type missing — run npm run db:seed");

  const user = await prisma.user.create({
    data: { email: TEST_EMAIL, name: "Smoke Test" },
  });
  check("created user", Boolean(user.id));

  const collection = await prisma.collection.create({
    data: { name: "Smoke Collection", userId: user.id },
  });

  const item = await prisma.item.create({
    data: {
      title: "Smoke Item",
      content: "console.log('hello')",
      language: "typescript",
      userId: user.id,
      itemTypeId: snippetType.id,
      tags: { create: [{ name: "smoke", userId: user.id }] },
      collections: { create: [{ collectionId: collection.id }] },
    },
    include: { tags: true, collections: true, itemType: true },
  });
  check("created item with tag and collection", item.tags.length === 1 && item.collections.length === 1);
  check("relation resolves to its type", item.itemType.slug === "snippets");

  const updated = await prisma.item.update({
    where: { id: item.id },
    data: { lastUsedAt: new Date(), isFavorite: true },
  });
  check("updated item", updated.isFavorite && updated.lastUsedAt !== null);

  // Soft delete, the reason deletedAt leads the list indexes.
  await prisma.item.update({
    where: { id: item.id },
    data: { deletedAt: new Date() },
  });
  const live = await prisma.item.findMany({
    where: { userId: user.id, deletedAt: null },
  });
  check("soft-deleted item excluded from live query", live.length === 0);

  console.log("\nCascades");
  await removeTestUser();
  const orphanedItems = await prisma.item.count({ where: { userId: user.id } });
  const orphanedCollections = await prisma.collection.count({
    where: { userId: user.id },
  });
  const orphanedTags = await prisma.tag.count({ where: { userId: user.id } });
  check("deleting the user cleared its items", orphanedItems === 0);
  check("deleting the user cleared its collections", orphanedCollections === 0);
  check("deleting the user cleared its tags", orphanedTags === 0);

  // System types must survive — Item.itemType is onDelete: Restrict, and nothing
  // about deleting a user should touch them.
  const survivingTypes = await prisma.itemType.count({ where: { isSystem: true } });
  check(
    "system types untouched",
    survivingTypes === EXPECTED_SYSTEM_TYPES,
    `found ${survivingTypes}`,
  );
}

main()
  .then(() => {
    console.log(
      failures === 0
        ? "\nAll checks passed.\n"
        : `\n${failures} check(s) failed.\n`,
    );
    process.exitCode = failures === 0 ? 0 : 1;
  })
  .catch(async (error) => {
    console.error("\nSmoke test threw:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await removeTestUser().catch(() => {});
    await prisma.$disconnect();
  });
