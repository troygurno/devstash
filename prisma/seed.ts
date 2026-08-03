/**
 * Seeds the seven system item types.
 *
 * IDs are fixed rather than generated so the seed is idempotent and so the same row
 * carries the same id across dev, preview, and prod — `upsert` on a hardcoded id
 * makes re-running safe. System types have `userId: null` and `isSystem: true`;
 * custom types come later as a Pro feature.
 *
 * Run with `npm run db:seed`. Prisma 7 no longer seeds automatically after migrate.
 */
import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient, type ContentType } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

type SystemType = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  contentType: ContentType;
  sortOrder: number;
};

// Mirrors the item type table in context/project-overview.md §4.
const SYSTEM_ITEM_TYPES: SystemType[] = [
  {
    id: "sys-type-snippet",
    name: "Snippet",
    slug: "snippets",
    icon: "Code",
    color: "#3b82f6",
    contentType: "TEXT",
    sortOrder: 0,
  },
  {
    id: "sys-type-prompt",
    name: "Prompt",
    slug: "prompts",
    icon: "Sparkles",
    color: "#8b5cf6",
    contentType: "TEXT",
    sortOrder: 1,
  },
  {
    id: "sys-type-command",
    name: "Command",
    slug: "commands",
    icon: "Terminal",
    color: "#f97316",
    contentType: "TEXT",
    sortOrder: 2,
  },
  {
    id: "sys-type-note",
    name: "Note",
    slug: "notes",
    icon: "StickyNote",
    color: "#fde047",
    contentType: "TEXT",
    sortOrder: 3,
  },
  {
    id: "sys-type-link",
    name: "Link",
    slug: "links",
    icon: "Link",
    color: "#10b981",
    contentType: "URL",
    sortOrder: 4,
  },
  {
    id: "sys-type-file",
    name: "File",
    slug: "files",
    icon: "File",
    color: "#6b7280",
    contentType: "FILE",
    sortOrder: 5,
  },
  {
    id: "sys-type-image",
    name: "Image",
    slug: "images",
    icon: "Image",
    color: "#ec4899",
    contentType: "FILE",
    sortOrder: 6,
  },
];

async function main() {
  for (const type of SYSTEM_ITEM_TYPES) {
    await prisma.itemType.upsert({
      where: { id: type.id },
      update: { ...type, isSystem: true, userId: null },
      create: { ...type, isSystem: true, userId: null },
    });
  }

  console.log(`Seeded ${SYSTEM_ITEM_TYPES.length} system item types.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
