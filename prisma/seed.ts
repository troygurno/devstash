/**
 * Seeds the dev database with the seven system item types plus a demo working set:
 * one user, five collections, and eighteen items.
 *
 * Everything upserts on a fixed id, so `npm run db:seed` is safe to re-run and a row
 * keeps the same id across environments. The only non-deterministic column is
 * `emailVerified`, which the spec defines as the current date.
 *
 * The demo password is a development credential. Do not run this against the prod
 * branch — seeding is manual (`npm run db:seed`), so nothing stops you but you.
 *
 * Spec: context/features/seed-spec.md
 */
import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient, type ContentType } from "../src/generated/prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const DEMO_USER_ID = "demo-user";
const DEMO_EMAIL = "demo@devstash.io";
const DEMO_PASSWORD = "12345678";
const BCRYPT_ROUNDS = 12;

const TYPE_SNIPPET = "sys-type-snippet";
const TYPE_PROMPT = "sys-type-prompt";
const TYPE_COMMAND = "sys-type-command";
const TYPE_NOTE = "sys-type-note";
const TYPE_LINK = "sys-type-link";
const TYPE_FILE = "sys-type-file";
const TYPE_IMAGE = "sys-type-image";

// ─────────────────────────────────────────────
// SYSTEM ITEM TYPES
// ─────────────────────────────────────────────
// Icons and colors match the seed spec exactly. Order, capitalized names, `slug`,
// and `contentType` follow project-overview.md §4 — the spec omits the last two, and
// both are required by the schema and relied on by the sidebar.

type SystemType = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  contentType: ContentType;
  sortOrder: number;
};

const SYSTEM_ITEM_TYPES: SystemType[] = [
  { id: TYPE_SNIPPET, name: "Snippet", slug: "snippets", icon: "Code", color: "#3b82f6", contentType: "TEXT", sortOrder: 0 },
  { id: TYPE_PROMPT, name: "Prompt", slug: "prompts", icon: "Sparkles", color: "#8b5cf6", contentType: "TEXT", sortOrder: 1 },
  { id: TYPE_COMMAND, name: "Command", slug: "commands", icon: "Terminal", color: "#f97316", contentType: "TEXT", sortOrder: 2 },
  { id: TYPE_NOTE, name: "Note", slug: "notes", icon: "StickyNote", color: "#fde047", contentType: "TEXT", sortOrder: 3 },
  { id: TYPE_LINK, name: "Link", slug: "links", icon: "Link", color: "#10b981", contentType: "URL", sortOrder: 4 },
  { id: TYPE_FILE, name: "File", slug: "files", icon: "File", color: "#6b7280", contentType: "FILE", sortOrder: 5 },
  { id: TYPE_IMAGE, name: "Image", slug: "images", icon: "Image", color: "#ec4899", contentType: "FILE", sortOrder: 6 },
];

// ─────────────────────────────────────────────
// COLLECTIONS
// ─────────────────────────────────────────────

type SeedCollection = {
  id: string;
  name: string;
  description: string;
  defaultTypeId: string;
  isFavorite: boolean;
};

const COLLECTIONS: SeedCollection[] = [
  {
    id: "col-react-patterns",
    name: "React Patterns",
    description: "Reusable React patterns and hooks",
    defaultTypeId: TYPE_SNIPPET,
    isFavorite: true,
  },
  {
    id: "col-ai-workflows",
    name: "AI Workflows",
    description: "AI prompts and workflow automations",
    defaultTypeId: TYPE_PROMPT,
    isFavorite: true,
  },
  {
    id: "col-devops",
    name: "DevOps",
    description: "Infrastructure and deployment resources",
    defaultTypeId: TYPE_SNIPPET,
    isFavorite: false,
  },
  {
    id: "col-terminal-commands",
    name: "Terminal Commands",
    description: "Useful shell commands for everyday development",
    defaultTypeId: TYPE_COMMAND,
    isFavorite: true,
  },
  {
    id: "col-design-resources",
    name: "Design Resources",
    description: "UI/UX resources and references",
    defaultTypeId: TYPE_LINK,
    isFavorite: false,
  },
];

// ─────────────────────────────────────────────
// ITEMS
// ─────────────────────────────────────────────
// The spec fixes the type, collection, and subject of all eighteen items. It says
// nothing about tags, pins, favorites, or lastUsedAt — those are filled in here so
// the dashboard's Pinned and Recent sections have something to render. Fixed
// timestamps rather than offsets from now, to keep the seed deterministic.

type SeedItem = {
  id: string;
  collectionId: string;
  itemTypeId: string;
  title: string;
  description: string;
  content?: string;
  url?: string;
  language?: string;
  tags: string[];
  isPinned?: boolean;
  isFavorite?: boolean;
  lastUsedAt?: string;
};

const ITEMS: SeedItem[] = [
  // ── React Patterns — 3 TypeScript snippets ──
  {
    id: "item-use-debounce",
    collectionId: "col-react-patterns",
    itemTypeId: TYPE_SNIPPET,
    title: "useDebounce hook",
    description: "Debounce any reactive value with a configurable delay",
    language: "typescript",
    content: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}`,
    tags: ["react", "hooks", "typescript"],
    isPinned: true,
    isFavorite: true,
    lastUsedAt: "2026-08-03T09:12:00.000Z",
  },
  {
    id: "item-safe-context",
    collectionId: "col-react-patterns",
    itemTypeId: TYPE_SNIPPET,
    title: "Type-safe context provider",
    description: "Context factory that throws instead of silently returning undefined",
    language: "typescript",
    content: `import { createContext, useContext } from "react";

export function createSafeContext<T>(name: string) {
  const Context = createContext<T | null>(null);

  function useSafeContext(): T {
    const value = useContext(Context);
    if (value === null) {
      throw new Error(\`use\${name} must be used within \${name}Provider\`);
    }
    return value;
  }

  return [Context.Provider, useSafeContext] as const;
}`,
    tags: ["react", "context", "typescript"],
    isFavorite: true,
    lastUsedAt: "2026-08-02T16:40:00.000Z",
  },
  {
    id: "item-group-by",
    collectionId: "col-react-patterns",
    itemTypeId: TYPE_SNIPPET,
    title: "groupBy utility",
    description: "Group an array into a record keyed by a derived value",
    language: "typescript",
    content: `export function groupBy<T, K extends PropertyKey>(
  items: readonly T[],
  keyOf: (item: T) => K,
): Record<K, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = keyOf(item);
      (acc[key] ??= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>,
  );
}`,
    tags: ["typescript", "utils"],
    lastUsedAt: "2026-07-29T11:05:00.000Z",
  },

  // ── AI Workflows — 3 prompts ──
  {
    id: "item-prompt-code-review",
    collectionId: "col-ai-workflows",
    itemTypeId: TYPE_PROMPT,
    title: "Code review system prompt",
    description: "Senior-engineer review voice with severity ratings",
    content: `You are a staff engineer reviewing a pull request.

Flag correctness bugs first, then performance, then style.
Rate each finding critical / major / minor and cite the exact line.
Skip praise. If nothing is wrong, say so in one line.`,
    tags: ["review", "ai", "workflow"],
    isPinned: true,
    isFavorite: true,
    lastUsedAt: "2026-08-03T08:30:00.000Z",
  },
  {
    id: "item-prompt-docs",
    collectionId: "col-ai-workflows",
    itemTypeId: TYPE_PROMPT,
    title: "Documentation generator",
    description: "Turns a module into reference docs with runnable examples",
    content: `Document the module below as reference material, not a tutorial.

For each exported symbol: one-line summary, parameter table with types,
return value, and a runnable example.
Note thrown errors and edge cases. Omit anything you cannot infer from the code.`,
    tags: ["docs", "ai"],
    lastUsedAt: "2026-08-01T13:15:00.000Z",
  },
  {
    id: "item-prompt-refactor",
    collectionId: "col-ai-workflows",
    itemTypeId: TYPE_PROMPT,
    title: "Refactoring assistant",
    description: "Behavior-preserving refactors, smallest diff first",
    content: `Refactor the code below without changing observable behavior.

Prefer the smallest diff that removes the duplication or clarifies the intent.
List each change as: what moved, why, and what could break.
If the code is already clear, say so rather than inventing work.`,
    tags: ["refactor", "ai", "workflow"],
    isFavorite: true,
    lastUsedAt: "2026-07-31T15:50:00.000Z",
  },

  // ── DevOps — 1 snippet, 1 command, 2 links ──
  {
    id: "item-dockerfile-next",
    collectionId: "col-devops",
    itemTypeId: TYPE_SNIPPET,
    title: "Multi-stage Dockerfile for Next.js",
    description: "Standalone output, non-root user, minimal runtime layer",
    language: "dockerfile",
    content: `FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]`,
    tags: ["docker", "nextjs", "deployment"],
    isPinned: true,
    lastUsedAt: "2026-08-02T10:20:00.000Z",
  },
  {
    id: "item-cmd-deploy",
    collectionId: "col-devops",
    itemTypeId: TYPE_COMMAND,
    title: "Build, tag, and push a release image",
    description: "Tags with the short commit SHA so rollbacks are unambiguous",
    language: "bash",
    content: `TAG=$(git rev-parse --short HEAD)
docker build -t registry.example.com/devstash:$TAG .
docker push registry.example.com/devstash:$TAG
docker tag registry.example.com/devstash:$TAG registry.example.com/devstash:latest
docker push registry.example.com/devstash:latest`,
    tags: ["docker", "deployment", "cli"],
    lastUsedAt: "2026-07-30T09:00:00.000Z",
  },
  {
    id: "item-link-docker-multistage",
    collectionId: "col-devops",
    itemTypeId: TYPE_LINK,
    title: "Docker multi-stage builds",
    description: "Official guide to shrinking images with build stages",
    url: "https://docs.docker.com/build/building/multi-stage/",
    tags: ["docker", "docs"],
    lastUsedAt: "2026-07-28T14:22:00.000Z",
  },
  {
    id: "item-link-gh-actions",
    collectionId: "col-devops",
    itemTypeId: TYPE_LINK,
    title: "GitHub Actions documentation",
    description: "Workflow syntax, runners, and reusable actions",
    url: "https://docs.github.com/en/actions",
    tags: ["ci", "docs"],
    lastUsedAt: "2026-07-27T12:45:00.000Z",
  },

  // ── Terminal Commands — 4 commands ──
  {
    id: "item-cmd-undo-commit",
    collectionId: "col-terminal-commands",
    itemTypeId: TYPE_COMMAND,
    title: "Undo the last commit, keep the changes",
    description: "Soft reset so the work returns to the staging area",
    language: "bash",
    content: `git reset --soft HEAD~1`,
    tags: ["git", "cli"],
    isFavorite: true,
    lastUsedAt: "2026-08-03T07:55:00.000Z",
  },
  {
    id: "item-cmd-docker-prune",
    collectionId: "col-terminal-commands",
    itemTypeId: TYPE_COMMAND,
    title: "Prune all unused Docker resources",
    description: "Reclaims space from stopped containers, dangling images, and volumes",
    language: "bash",
    content: `docker system prune -a --volumes`,
    tags: ["docker", "cli"],
    lastUsedAt: "2026-08-01T18:10:00.000Z",
  },
  {
    id: "item-cmd-kill-port",
    collectionId: "col-terminal-commands",
    itemTypeId: TYPE_COMMAND,
    title: "Kill whatever is holding a port",
    description: "For when the dev server says the port is already in use",
    language: "bash",
    content: `# macOS / Linux
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`,
    tags: ["cli", "processes"],
    lastUsedAt: "2026-08-02T20:05:00.000Z",
  },
  {
    id: "item-cmd-npm-outdated",
    collectionId: "col-terminal-commands",
    itemTypeId: TYPE_COMMAND,
    title: "Audit and update dependencies",
    description: "See what drifted, then update within semver range",
    language: "bash",
    content: `npm outdated
npm update
npm audit --omit=dev`,
    tags: ["npm", "cli"],
    lastUsedAt: "2026-07-26T10:30:00.000Z",
  },

  // ── Design Resources — 4 links ──
  {
    id: "item-link-tailwind",
    collectionId: "col-design-resources",
    itemTypeId: TYPE_LINK,
    title: "Tailwind CSS documentation",
    description: "Utility reference and the v4 CSS-first theme directive",
    url: "https://tailwindcss.com/docs",
    tags: ["tailwind", "css", "docs"],
    isFavorite: true,
    lastUsedAt: "2026-08-02T11:40:00.000Z",
  },
  {
    id: "item-link-shadcn",
    collectionId: "col-design-resources",
    itemTypeId: TYPE_LINK,
    title: "shadcn/ui",
    description: "Copy-in component library built on Radix and Tailwind",
    url: "https://ui.shadcn.com",
    tags: ["components", "react", "ui"],
    lastUsedAt: "2026-08-01T09:25:00.000Z",
  },
  {
    id: "item-link-material-design",
    collectionId: "col-design-resources",
    itemTypeId: TYPE_LINK,
    title: "Material Design 3",
    description: "Design system reference for tokens, typography, and motion",
    url: "https://m3.material.io/",
    tags: ["design-system", "reference"],
    lastUsedAt: "2026-07-25T16:00:00.000Z",
  },
  {
    id: "item-link-lucide",
    collectionId: "col-design-resources",
    itemTypeId: TYPE_LINK,
    title: "Lucide icons",
    description: "The icon set DevStash uses for item types",
    url: "https://lucide.dev/icons/",
    tags: ["icons", "ui"],
    lastUsedAt: "2026-07-24T13:35:00.000Z",
  },
];

// ─────────────────────────────────────────────

async function seedSystemItemTypes() {
  for (const type of SYSTEM_ITEM_TYPES) {
    await prisma.itemType.upsert({
      where: { id: type.id },
      update: { ...type, isSystem: true, userId: null },
      create: { ...type, isSystem: true, userId: null },
    });
  }
  return SYSTEM_ITEM_TYPES.length;
}

async function seedDemoUser() {
  const passwordHash = await hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
  const fields = {
    email: DEMO_EMAIL,
    name: "Demo User",
    passwordHash,
    isPro: false,
    emailVerified: new Date(),
  };

  return prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: fields,
    create: { id: DEMO_USER_ID, ...fields },
  });
}

async function seedTags(userId: string) {
  const names = [...new Set(ITEMS.flatMap((item) => item.tags))].sort();

  for (const name of names) {
    await prisma.tag.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { name, userId },
    });
  }

  return names.length;
}

async function seedCollections(userId: string) {
  for (const collection of COLLECTIONS) {
    await prisma.collection.upsert({
      where: { id: collection.id },
      update: { ...collection, userId },
      create: { ...collection, userId },
    });
  }
  return COLLECTIONS.length;
}

async function seedItems(userId: string) {
  for (const item of ITEMS) {
    const { collectionId, tags, lastUsedAt, ...rest } = item;

    const fields = {
      ...rest,
      userId,
      lastUsedAt: lastUsedAt ? new Date(lastUsedAt) : null,
      isPinned: item.isPinned ?? false,
      isFavorite: item.isFavorite ?? false,
    };

    const tagConnect = tags.map((name) => ({ userId_name: { userId, name } }));

    await prisma.item.upsert({
      where: { id: item.id },
      // `set` rather than `connect` so a re-run after editing this file drops tags
      // that were removed instead of accumulating them.
      update: { ...fields, tags: { set: tagConnect } },
      create: { ...fields, tags: { connect: tagConnect } },
    });

    await prisma.itemCollection.upsert({
      where: { itemId_collectionId: { itemId: item.id, collectionId } },
      update: {},
      create: { itemId: item.id, collectionId },
    });
  }

  return ITEMS.length;
}

async function main() {
  const typeCount = await seedSystemItemTypes();
  const user = await seedDemoUser();
  const tagCount = await seedTags(user.id);
  const collectionCount = await seedCollections(user.id);
  const itemCount = await seedItems(user.id);

  console.log(
    [
      `Seeded ${typeCount} system item types`,
      `1 user (${DEMO_EMAIL})`,
      `${tagCount} tags`,
      `${collectionCount} collections`,
      `${itemCount} items`,
    ].join(", ") + ".",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
