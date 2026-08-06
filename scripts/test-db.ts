/**
 * Database smoke test — connectivity, seed state, constraints, and a full CRUD
 * round-trip, plus a printed dump of the seeded demo data. Run with `npm run db:test`.
 *
 * Writes to whatever DATABASE_URL points at, so keep it on the Neon **dev** branch.
 * Everything it creates hangs off one throwaway user that is deleted at both ends of
 * the run, so a crash mid-test doesn't leave residue for the next one.
 *
 * Markers in the item listing: `P` pinned, `*` favorite.
 */
import "dotenv/config";
import { compare } from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "../src/generated/prisma/client";

const TEST_EMAIL = "db-smoke-test@devstash.local";
const EXPECTED_SYSTEM_TYPES = 7;

// Demo working set from prisma/seed.ts.
const DEMO_EMAIL = "demo@devstash.io";
const DEMO_PASSWORD = "12345678";
const EXPECTED_COLLECTIONS = 5;
const EXPECTED_ITEMS = 18;

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

function pad(value: string, width: number) {
  return value.length > width
    ? `${value.slice(0, width - 1)}…`
    : value.padEnd(width);
}

function shortDate(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "—";
}

/** Fetches the demo user with everything the display and the checks need. */
function loadDemoUser() {
  return prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: {
      tags: true,
      items: { include: { tags: true, itemType: true } },
      collections: {
        orderBy: { name: "asc" },
        include: {
          defaultType: true,
          items: {
            orderBy: { addedAt: "asc" },
            include: { item: { include: { itemType: true, tags: true } } },
          },
        },
      },
    },
  });
}

type DemoUser = NonNullable<Awaited<ReturnType<typeof loadDemoUser>>>;

function printDemoData(
  demo: DemoUser,
  systemTypes: { id: string; name: string; slug: string }[],
) {
  console.log(
    `\n  ${demo.name} <${demo.email}>  ·  ${demo.isPro ? "Pro" : "Free"}  ·  ` +
      `email verified ${shortDate(demo.emailVerified)}`,
  );
  console.log(
    `  ${demo.collections.length} collections · ${demo.items.length} items · ` +
      `${demo.tags.length} tags`,
  );

  console.log("\n  Items by type");
  for (const type of systemTypes) {
    const count = demo.items.filter(
      (item) => item.itemTypeId === type.id,
    ).length;
    console.log(
      `    ${pad(type.name, 9)} ${String(count).padStart(2)}  ${"#".repeat(count)}`,
    );
  }

  console.log("\n  Collections");
  for (const collection of demo.collections) {
    const star = collection.isFavorite ? " *" : "";
    console.log(
      `\n    ${collection.name}${star} — ${collection.description} ` +
        `(${collection.items.length} items, default ${collection.defaultType?.name ?? "none"})`,
    );

    for (const { item } of collection.items) {
      const markers = `${item.isPinned ? "P" : " "}${item.isFavorite ? "*" : " "}`;
      const body = item.url ?? item.content ?? "";
      console.log(
        `      ${markers} ${pad(item.itemType.name, 8)} ${pad(item.title, 38)} ` +
          `${pad(item.tags.map((t) => t.name).join(", "), 30)} ` +
          `${shortDate(item.lastUsedAt)}  ${body.length} chars`,
      );
    }
  }

  const recent = [...demo.items]
    .filter((item) => item.lastUsedAt !== null)
    .sort((a, b) => b.lastUsedAt!.getTime() - a.lastUsedAt!.getTime())
    .slice(0, 5);

  console.log("\n  Most recently used");
  for (const item of recent) {
    console.log(`    ${shortDate(item.lastUsedAt)}  ${item.title}`);
  }

  const pinned = demo.items.filter((item) => item.isPinned);
  console.log("\n  Pinned");
  for (const item of pinned) {
    console.log(`    ${pad(item.itemType.name, 8)} ${item.title}`);
  }
}

/** The columns the later sections need off a system type. */
type SystemType = { id: string; name: string; slug: string };

async function checkConnection() {
  console.log("\nConnection");
  const [{ now }] = await prisma.$queryRaw<[{ now: Date }]>`SELECT now() as now`;
  check("reached the database", Boolean(now), now?.toISOString());
}

/** Returns the system types — both later sections need them. */
async function checkSeedData() {
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

  return systemTypes;
}

async function checkDemoWorkingSet(systemTypes: SystemType[]) {
  console.log("\nDemo working set");
  const demo = await loadDemoUser();

  if (!demo) {
    check("demo user exists", false, `run npm run db:seed`);
  } else {
    printDemoData(demo, systemTypes);

    console.log("");
    check("demo user exists", true, demo.name ?? "");
    check(
      "password verifies against the stored hash",
      demo.passwordHash !== null &&
        (await compare(DEMO_PASSWORD, demo.passwordHash)),
    );
    check(
      "hash is bcrypt at 12 rounds",
      demo.passwordHash?.startsWith("$2") === true &&
        demo.passwordHash?.split("$")[2] === "12",
    );
    check("demo user is not Pro", demo.isPro === false);
    check(
      `${EXPECTED_COLLECTIONS} collections`,
      demo.collections.length === EXPECTED_COLLECTIONS,
      `found ${demo.collections.length}`,
    );
    check(
      `${EXPECTED_ITEMS} items`,
      demo.items.length === EXPECTED_ITEMS,
      `found ${demo.items.length}`,
    );
    check(
      "every item sits in a collection",
      demo.collections.reduce(
        (sum, collection) => sum + collection.items.length,
        0,
      ) === EXPECTED_ITEMS,
    );
    check(
      "every collection has a default type and a description",
      demo.collections.every(
        (collection) =>
          collection.defaultType !== null && collection.description !== null,
      ),
    );
    check(
      "link items point at real http(s) URLs",
      demo.items
        .filter((item) => item.itemType.contentType === "URL")
        .every((item) => item.url?.startsWith("https://")),
    );
    check(
      "nothing is soft-deleted",
      demo.items.every((item) => item.deletedAt === null),
    );
    check(
      "every item has at least one tag",
      demo.items.every((item) => item.tags.length > 0),
    );
    check(
      "tags are scoped to the demo user",
      demo.tags.length > 0 && demo.tags.every((tag) => tag.userId === demo.id),
    );
    check(
      "content matches the type's contentType",
      demo.items.every((item) =>
        item.itemType.contentType === "URL"
          ? item.url !== null && item.content === null
          : item.content !== null && item.url === null,
      ),
    );
    // The dashboard's main area is Pinned + Recent; both need rows to render.
    check(
      "some items are pinned",
      demo.items.filter((item) => item.isPinned).length > 0,
      `${demo.items.filter((item) => item.isPinned).length} pinned`,
    );
    check(
      "most items have lastUsedAt",
      demo.items.filter((item) => item.lastUsedAt !== null).length >=
        EXPECTED_ITEMS - 2,
    );
  }
}

async function checkConstraints() {
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
}

/**
 * Creates a throwaway user, exercises the write path against it, then deletes it
 * and asserts the cascades fired. The cascade checks stay in here because they
 * assert on the user this function created.
 */
async function checkCrudRoundTrip(systemTypes: SystemType[]) {
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

  // collection_user_name_live_key is partial (WHERE deletedAt IS NULL), so a name
  // is unique among live rows only. Prisma can't express that, so nothing but this
  // check covers it.
  let duplicateNameRejected = false;
  try {
    await prisma.collection.create({
      data: { name: "Smoke Collection", userId: user.id },
    });
  } catch {
    duplicateNameRejected = true;
  }
  check("duplicate live collection name rejected", duplicateNameRejected);

  await prisma.collection.update({
    where: { id: collection.id },
    data: { deletedAt: new Date() },
  });
  const reused = await prisma.collection.create({
    data: { name: "Smoke Collection", userId: user.id },
  });
  check(
    "name reusable once the original is soft-deleted",
    Boolean(reused.id),
    "partial index ignores deleted rows",
  );

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

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — check .env against .env.example");
  }

  await checkConnection();
  const systemTypes = await checkSeedData();
  await checkDemoWorkingSet(systemTypes);
  await checkConstraints();
  await checkCrudRoundTrip(systemTypes);
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
