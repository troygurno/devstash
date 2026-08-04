/**
 * Item queries for the dashboard.
 *
 * The type and the tags a row needs to paint itself are relations, so they're
 * joined here rather than looked up from a static map — `DashboardItem` is the
 * flattened shape `ItemRow` actually consumes, not the Prisma model.
 */
import { prisma } from "@/lib/prisma";

/** Just enough of an ItemType to paint an icon, a tint, and a border. */
export interface ItemTypeAccent {
  id: string;
  name: string;
  slug: string;
  /** lucide icon name — see getItemTypeIcon in src/lib/item-types.ts */
  icon: string;
}

export interface DashboardItem {
  id: string;
  title: string;
  description: string | null;
  type: ItemTypeAccent;
  /** Tag names, alphabetical. */
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  /** Null until the item is first copied or opened. */
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface ItemStats {
  total: number;
  favorites: number;
}

/**
 * One select for both list queries, so Pinned and Recent can't drift apart.
 * `tags` and `itemType` are relations — Prisma resolves them in the same round
 * trip, not one query per row.
 */
const DASHBOARD_ITEM_SELECT = {
  id: true,
  title: true,
  description: true,
  isPinned: true,
  isFavorite: true,
  lastUsedAt: true,
  createdAt: true,
  itemType: { select: { id: true, name: true, slug: true, icon: true } },
  tags: { select: { name: true }, orderBy: { name: "asc" } },
} as const;

/** The shape `DASHBOARD_ITEM_SELECT` returns, before flattening. */
interface ItemRowResult {
  id: string;
  title: string;
  description: string | null;
  isPinned: boolean;
  isFavorite: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  itemType: ItemTypeAccent;
  tags: { name: string }[];
}

/**
 * Every pinned item, newest use first. Uncapped on purpose: pinning is a
 * deliberate act and a user who pins twelve items means to see twelve.
 */
export async function getPinnedItems(userId: string): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { userId, deletedAt: null, isPinned: true },
    orderBy: [{ lastUsedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: DASHBOARD_ITEM_SELECT,
  });

  return items.map(toDashboardItem);
}

/**
 * Most recently used items, excluding anything Pinned already shows — both
 * sections sit on the same screen and a row in both reads as a bug.
 *
 * Items never used sort last rather than dropping out. An item saved and not yet
 * copied is still the most relevant thing on the dashboard for a new account,
 * and hiding it would leave Recent looking empty on a stash that isn't.
 */
export async function getRecentItems(
  userId: string,
  limit: number,
): Promise<DashboardItem[]> {
  const items = await prisma.item.findMany({
    where: { userId, deletedAt: null, isPinned: false },
    orderBy: [{ lastUsedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take: limit,
    select: DASHBOARD_ITEM_SELECT,
  });

  return items.map(toDashboardItem);
}

/** Totals for the stat cards — every item, not just the two rendered sections. */
export async function getItemStats(userId: string): Promise<ItemStats> {
  const [total, favorites] = await Promise.all([
    prisma.item.count({ where: { userId, deletedAt: null } }),
    prisma.item.count({
      where: { userId, deletedAt: null, isFavorite: true },
    }),
  ]);

  return { total, favorites };
}

function toDashboardItem(item: ItemRowResult): DashboardItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.itemType,
    tags: item.tags.map((tag) => tag.name),
    isPinned: item.isPinned,
    isFavorite: item.isFavorite,
    lastUsedAt: item.lastUsedAt,
    createdAt: item.createdAt,
  };
}
