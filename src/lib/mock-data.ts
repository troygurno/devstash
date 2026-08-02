/**
 * Temporary mock data for the dashboard UI.
 * Shapes mirror the Prisma models in context/project-overview.md so swapping
 * these imports for real queries later is a drop-in change.
 *
 * `itemCount` on types and collections is display-only — the `mockItems` array
 * below is a small sample, not the full set those counts describe.
 */

export type ContentType = "TEXT" | "URL" | "FILE";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
}

export interface MockItemType {
  id: string;
  name: string;
  slug: string;
  /** lucide-react icon name */
  icon: string;
  /** hex */
  color: string;
  contentType: ContentType;
  isPro: boolean;
  itemCount: number;
}

export interface MockCollection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  /** drives the card tint — the type this collection holds most of */
  dominantTypeId: string;
  /** types present in the collection, for the icon row on the card */
  typeIds: string[];
  itemCount: number;
}

export interface MockItem {
  id: string;
  title: string;
  description: string;
  itemTypeId: string;
  /** populated for TEXT types */
  content: string | null;
  /** populated for URL types */
  url: string | null;
  /** populated for FILE types */
  fileName: string | null;
  /** bytes */
  fileSize: number | null;
  /** syntax highlighting hint */
  language: string | null;
  tags: string[];
  collectionIds: string[];
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const mockUser: MockUser = {
  id: "user-1",
  name: "John Doe",
  email: "john@example.com",
  image: null,
  isPro: false,
};

export const mockItemTypes: MockItemType[] = [
  {
    id: "type-snippet",
    name: "Snippets",
    slug: "snippets",
    icon: "Code",
    color: "#3b82f6",
    contentType: "TEXT",
    isPro: false,
    itemCount: 24,
  },
  {
    id: "type-prompt",
    name: "Prompts",
    slug: "prompts",
    icon: "Sparkles",
    color: "#8b5cf6",
    contentType: "TEXT",
    isPro: false,
    itemCount: 18,
  },
  {
    id: "type-command",
    name: "Commands",
    slug: "commands",
    icon: "Terminal",
    color: "#f97316",
    contentType: "TEXT",
    isPro: false,
    itemCount: 15,
  },
  {
    id: "type-note",
    name: "Notes",
    slug: "notes",
    icon: "StickyNote",
    color: "#fde047",
    contentType: "TEXT",
    isPro: false,
    itemCount: 12,
  },
  {
    id: "type-link",
    name: "Links",
    slug: "links",
    icon: "Link",
    color: "#10b981",
    contentType: "URL",
    isPro: false,
    itemCount: 8,
  },
  {
    id: "type-file",
    name: "Files",
    slug: "files",
    icon: "File",
    color: "#6b7280",
    contentType: "FILE",
    isPro: true,
    itemCount: 5,
  },
  {
    id: "type-image",
    name: "Images",
    slug: "images",
    icon: "Image",
    color: "#ec4899",
    contentType: "FILE",
    isPro: true,
    itemCount: 3,
  },
];

export const mockCollections: MockCollection[] = [
  {
    id: "col-react-patterns",
    name: "React Patterns",
    description: "Common React patterns and hooks",
    isFavorite: true,
    dominantTypeId: "type-snippet",
    typeIds: ["type-snippet", "type-note", "type-link"],
    itemCount: 12,
  },
  {
    id: "col-python-snippets",
    name: "Python Snippets",
    description: "Useful Python code snippets",
    isFavorite: false,
    dominantTypeId: "type-snippet",
    typeIds: ["type-snippet", "type-note"],
    itemCount: 8,
  },
  {
    id: "col-context-files",
    name: "Context Files",
    description: "AI context files for projects",
    isFavorite: true,
    dominantTypeId: "type-file",
    typeIds: ["type-file", "type-note"],
    itemCount: 5,
  },
  {
    id: "col-interview-prep",
    name: "Interview Prep",
    description: "Technical interview preparation",
    isFavorite: false,
    dominantTypeId: "type-note",
    typeIds: ["type-note", "type-snippet", "type-link", "type-prompt"],
    itemCount: 24,
  },
  {
    id: "col-git-commands",
    name: "Git Commands",
    description: "Frequently used git commands",
    isFavorite: true,
    dominantTypeId: "type-command",
    typeIds: ["type-command", "type-note"],
    itemCount: 15,
  },
  {
    id: "col-ai-prompts",
    name: "AI Prompts",
    description: "Curated AI prompts for coding",
    isFavorite: false,
    dominantTypeId: "type-prompt",
    typeIds: ["type-prompt", "type-snippet", "type-note"],
    itemCount: 18,
  },
];

export const mockItems: MockItem[] = [
  {
    id: "item-use-auth",
    title: "useAuth Hook",
    description: "Custom authentication hook for React applications",
    itemTypeId: "type-snippet",
    content: `import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}`,
    url: null,
    fileName: null,
    fileSize: null,
    language: "typescript",
    tags: ["react", "auth", "hooks"],
    collectionIds: ["col-react-patterns"],
    isFavorite: true,
    isPinned: true,
    lastUsedAt: "2026-08-02T09:12:00.000Z",
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "item-api-error-handling",
    title: "API Error Handling Pattern",
    description: "Fetch wrapper with exponential backoff retry logic",
    itemTypeId: "type-snippet",
    content: `export async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url)
      if (res.ok) return res.json()
    } catch (err) {
      if (i === retries - 1) throw err
    }
    await new Promise((r) => setTimeout(r, 2 ** i * 200))
  }
}`,
    url: null,
    fileName: null,
    fileSize: null,
    language: "typescript",
    tags: ["fetch", "errors", "retry"],
    collectionIds: ["col-react-patterns"],
    isFavorite: false,
    isPinned: true,
    lastUsedAt: "2026-08-01T16:40:00.000Z",
    createdAt: "2026-01-12T14:20:00.000Z",
    updatedAt: "2026-01-20T08:05:00.000Z",
  },
  {
    id: "item-reset-branch",
    title: "Reset local branch to origin",
    description: "Nuke local changes and match the remote exactly",
    itemTypeId: "type-command",
    content: `git fetch origin
git reset --hard origin/main
git clean -fd`,
    url: null,
    fileName: null,
    fileSize: null,
    language: "bash",
    tags: ["git", "cli"],
    collectionIds: ["col-git-commands"],
    isFavorite: false,
    isPinned: true,
    lastUsedAt: "2026-08-02T08:30:00.000Z",
    createdAt: "2026-02-03T11:00:00.000Z",
    updatedAt: "2026-02-03T11:00:00.000Z",
  },
  {
    id: "item-code-review-prompt",
    title: "Code review system prompt",
    description: "Terse, senior-engineer review voice with severity ratings",
    itemTypeId: "type-prompt",
    content: `You are a staff engineer reviewing a pull request.
Flag correctness bugs first, then performance, then style.
Rate each finding critical / major / minor and cite the line.
Skip praise. If nothing is wrong, say so in one line.`,
    url: null,
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["review", "ai", "workflow"],
    collectionIds: ["col-ai-prompts"],
    isFavorite: true,
    isPinned: true,
    lastUsedAt: "2026-08-01T13:15:00.000Z",
    createdAt: "2026-03-18T09:45:00.000Z",
    updatedAt: "2026-06-02T17:30:00.000Z",
  },
  {
    id: "item-use-debounced-value",
    title: "useDebouncedValue hook",
    description: "Debounce any reactive value with a configurable delay",
    itemTypeId: "type-snippet",
    content: `import { useEffect, useState } from 'react'

export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}`,
    url: null,
    fileName: null,
    fileSize: null,
    language: "typescript",
    tags: ["react", "hooks"],
    collectionIds: ["col-react-patterns"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-08-02T09:48:00.000Z",
    createdAt: "2026-04-22T15:10:00.000Z",
    updatedAt: "2026-04-22T15:10:00.000Z",
  },
  {
    id: "item-docker-prune",
    title: "Prune all unused Docker resources",
    description: "Reclaim disk space from stopped containers and dangling images",
    itemTypeId: "type-command",
    content: "docker system prune -a --volumes",
    url: null,
    fileName: null,
    fileSize: null,
    language: "bash",
    tags: ["docker", "cli"],
    collectionIds: ["col-git-commands"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-07-30T10:05:00.000Z",
    createdAt: "2026-05-09T12:00:00.000Z",
    updatedAt: "2026-05-09T12:00:00.000Z",
  },
  {
    id: "item-list-comprehension",
    title: "Flatten a nested list",
    description: "One-line flatten with a nested comprehension",
    itemTypeId: "type-snippet",
    content: "flat = [x for row in matrix for x in row]",
    url: null,
    fileName: null,
    fileSize: null,
    language: "python",
    tags: ["python", "lists"],
    collectionIds: ["col-python-snippets"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-07-28T14:22:00.000Z",
    createdAt: "2026-05-30T09:00:00.000Z",
    updatedAt: "2026-05-30T09:00:00.000Z",
  },
  {
    id: "item-commit-message-prompt",
    title: "Conventional commit generator",
    description: "Turns a diff into a single conventional commit message",
    itemTypeId: "type-prompt",
    content: `Read the diff below and write one conventional commit message.
Use feat / fix / chore / docs / refactor. Imperative mood.
Subject under 72 characters. No body unless the change is non-obvious.`,
    url: null,
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["git", "ai"],
    collectionIds: ["col-ai-prompts"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-08-01T11:50:00.000Z",
    createdAt: "2026-06-11T16:30:00.000Z",
    updatedAt: "2026-06-11T16:30:00.000Z",
  },
  {
    id: "item-postgres-index-notes",
    title: "When Postgres ignores your index",
    description: "Notes on planner behavior and low-selectivity columns",
    itemTypeId: "type-note",
    content: `The planner skips an index when it estimates a sequential scan is cheaper —
usually on small tables or low-selectivity columns.

- Check with EXPLAIN ANALYZE, not EXPLAIN
- Stale statistics are the usual cause; run ANALYZE
- Partial indexes help when queries always filter the same way`,
    url: null,
    fileName: null,
    fileSize: null,
    language: "markdown",
    tags: ["postgres", "performance"],
    collectionIds: ["col-interview-prep"],
    isFavorite: true,
    isPinned: false,
    lastUsedAt: "2026-07-25T09:00:00.000Z",
    createdAt: "2026-06-25T13:40:00.000Z",
    updatedAt: "2026-07-02T10:15:00.000Z",
  },
  {
    id: "item-system-design-note",
    title: "System design interview checklist",
    description: "Order to work through a design question under time pressure",
    itemTypeId: "type-note",
    content: `1. Clarify requirements and scale before drawing anything
2. Define the API surface
3. Data model, then storage choice
4. Draw the happy path end to end
5. Then bottlenecks: cache, queue, shard
6. Close with failure modes and monitoring`,
    url: null,
    fileName: null,
    fileSize: null,
    language: "markdown",
    tags: ["interview", "architecture"],
    collectionIds: ["col-interview-prep"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-07-20T18:00:00.000Z",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
  },
  {
    id: "item-tailwind-docs",
    title: "Tailwind CSS v4 theme docs",
    description: "CSS-first configuration with the @theme directive",
    itemTypeId: "type-link",
    content: null,
    url: "https://tailwindcss.com/docs/theme",
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["tailwind", "docs", "css"],
    collectionIds: ["col-react-patterns"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-07-31T15:05:00.000Z",
    createdAt: "2026-07-05T11:20:00.000Z",
    updatedAt: "2026-07-05T11:20:00.000Z",
  },
  {
    id: "item-prisma-docs",
    title: "Prisma 7 upgrade guide",
    description: "Driver adapters, required output path, ESM requirement",
    itemTypeId: "type-link",
    content: null,
    url: "https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7",
    fileName: null,
    fileSize: null,
    language: null,
    tags: ["prisma", "docs"],
    collectionIds: [],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-07-29T09:30:00.000Z",
    createdAt: "2026-07-08T10:00:00.000Z",
    updatedAt: "2026-07-08T10:00:00.000Z",
  },
  {
    id: "item-claude-context",
    title: "CLAUDE.md starter",
    description: "Baseline project context file for new repos",
    itemTypeId: "type-file",
    content: null,
    url: null,
    fileName: "CLAUDE.md",
    fileSize: 4820,
    language: null,
    tags: ["ai", "context"],
    collectionIds: ["col-context-files"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-07-27T12:45:00.000Z",
    createdAt: "2026-07-10T14:00:00.000Z",
    updatedAt: "2026-07-19T16:20:00.000Z",
  },
  {
    id: "item-arch-diagram",
    title: "DevStash architecture diagram",
    description: "Request flow from client through to Neon and R2",
    itemTypeId: "type-image",
    content: null,
    url: null,
    fileName: "architecture-v2.png",
    fileSize: 284310,
    language: null,
    tags: ["architecture", "diagram"],
    collectionIds: ["col-context-files"],
    isFavorite: false,
    isPinned: false,
    lastUsedAt: "2026-07-22T17:10:00.000Z",
    createdAt: "2026-07-14T09:15:00.000Z",
    updatedAt: "2026-07-14T09:15:00.000Z",
  },
];
