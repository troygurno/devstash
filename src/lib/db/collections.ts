/**
 * Collection queries for the dashboard and the sidebar.
 *
 * `itemCount`, `dominantType`, and `types` are not columns — they're derived from
 * the items a collection holds, so they live on the query result rather than on
 * the Prisma model.
 */
import { prisma } from "@/lib/prisma";

/** Just enough of an ItemType to paint an icon in its color. */
export interface CollectionType {
  id: string;
  name: string;
  slug: string;
  /** lucide icon name — see getItemTypeIcon in src/lib/item-types.ts */
  icon: string;
}

export interface DashboardCollection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  /** Drives the card's accent border. Null for an empty collection — neutral gray. */
  dominantType: CollectionType | null;
  /** Distinct types present, most-used first. */
  types: CollectionType[];
  updatedAt: Date;
}

/** The sidebar lists a name and a color, nothing else. */
export interface SidebarCollection {
  id: string;
  name: string;
  /** Drives the dot on a Recent row. Null for an empty collection — neutral gray. */
  dominantType: CollectionType | null;
}

export interface SidebarCollections {
  favorites: SidebarCollection[];
  recent: SidebarCollection[];
}

export interface CollectionStats {
  total: number;
  favorites: number;
}

/** One row per (collection, type) pair returned by the grouped count. */
interface TypeCountRow {
  collectionId: string;
  itemTypeId: string;
  count: number;
}

/** A type present in a collection, with how many items it accounts for. */
interface RankedType {
  type: CollectionType;
  count: number;
}

/** The columns every collection query needs to resolve a dominant type. */
const COLLECTION_ACCENT_SELECT = {
  id: true,
  name: true,
  defaultTypeId: true,
} as const;

/**
 * Most recently updated collections, with a per-type breakdown of their contents.
 *
 * Three round trips regardless of how many collections come back — the type
 * breakdown is grouped in Postgres rather than tallied from membership rows,
 * which keeps a collection of 500 items the same cost as one holding 5.
 */
export async function getRecentCollections(
  userId: string,
  limit: number,
): Promise<DashboardCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      ...COLLECTION_ACCENT_SELECT,
      description: true,
      isFavorite: true,
      updatedAt: true,
    },
  });

  if (collections.length === 0) return [];

  const rankedByCollection = await rankTypesByCollection(
    userId,
    collections.map((collection) => collection.id),
  );

  return collections.map((collection) => {
    const ranked = rankedByCollection.get(collection.id) ?? [];

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      itemCount: ranked.reduce((total, row) => total + row.count, 0),
      dominantType: pickDominantType(ranked, collection.defaultTypeId),
      types: ranked.map((row) => row.type),
      updatedAt: collection.updatedAt,
    };
  });
}

/**
 * The sidebar's two collection lists.
 *
 * Recent spans every collection, so a favorite can appear in both groups — the
 * two lists are unioned before the type breakdown runs, keeping that to one
 * query rather than one per list.
 */
export async function getSidebarCollections(
  userId: string,
  recentLimit: number,
): Promise<SidebarCollections> {
  const [favorites, recent] = await Promise.all([
    prisma.collection.findMany({
      // Alphabetical: a pinned-by-hand list shouldn't reorder itself whenever an
      // item is added, the way the Recent list below is meant to.
      where: { userId, deletedAt: null, isFavorite: true },
      orderBy: { name: "asc" },
      select: COLLECTION_ACCENT_SELECT,
    }),
    prisma.collection.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: recentLimit,
      select: COLLECTION_ACCENT_SELECT,
    }),
  ]);

  const ids = [...new Set([...favorites, ...recent].map((c) => c.id))];
  const rankedByCollection = await rankTypesByCollection(userId, ids);

  const toSidebarCollection = (collection: {
    id: string;
    name: string;
    defaultTypeId: string | null;
  }): SidebarCollection => ({
    id: collection.id,
    name: collection.name,
    dominantType: pickDominantType(
      rankedByCollection.get(collection.id) ?? [],
      collection.defaultTypeId,
    ),
  });

  return {
    favorites: favorites.map(toSidebarCollection),
    recent: recent.map(toSidebarCollection),
  };
}

/** Totals for the stat cards — counts every collection, not just the recent page. */
export async function getCollectionStats(
  userId: string,
): Promise<CollectionStats> {
  const [total, favorites] = await Promise.all([
    prisma.collection.count({ where: { userId, deletedAt: null } }),
    prisma.collection.count({
      where: { userId, deletedAt: null, isFavorite: true },
    }),
  ]);

  return { total, favorites };
}

/**
 * Types present in each of the given collections, most-used first.
 *
 * Prisma's `groupBy` can't express this: the count keys on
 * `(collectionId, itemTypeId)` and `itemTypeId` lives on `Item`, one hop past
 * `ItemCollection`. Grouping in Postgres beats loading membership rows and
 * tallying in JS, which is what the card color rule in
 * context/project-overview.md §11 warns against.
 */
async function rankTypesByCollection(
  userId: string,
  collectionIds: string[],
): Promise<Map<string, RankedType[]>> {
  if (collectionIds.length === 0) return new Map();

  const [countRows, itemTypes] = await Promise.all([
    // COUNT(*) is int8, which the driver hands back as a string — the ::int cast
    // is what makes `count` a number on this side.
    prisma.$queryRaw<TypeCountRow[]>`
      SELECT ic."collectionId", i."itemTypeId", COUNT(*)::int AS "count"
      FROM "ItemCollection" ic
      JOIN "Item" i ON i."id" = ic."itemId"
      WHERE ic."collectionId" = ANY(${collectionIds}::text[])
        AND i."userId" = ${userId}
        AND i."deletedAt" IS NULL
      GROUP BY ic."collectionId", i."itemTypeId"
    `,
    prisma.itemType.findMany({
      select: { id: true, name: true, slug: true, icon: true, sortOrder: true },
    }),
  ]);

  const typeById = new Map(itemTypes.map((type) => [type.id, type]));

  const rowsByCollection = new Map<string, TypeCountRow[]>();
  for (const row of countRows) {
    const rows = rowsByCollection.get(row.collectionId);
    if (rows) rows.push(row);
    else rowsByCollection.set(row.collectionId, [row]);
  }

  const ranked = new Map<string, RankedType[]>();
  for (const [collectionId, rows] of rowsByCollection) {
    ranked.set(
      collectionId,
      rows
        .filter((row) => typeById.has(row.itemTypeId))
        // Most-used first; sortOrder breaks count ties so the icon row and the
        // dominant type don't reshuffle between requests.
        .sort((a, b) => {
          if (b.count !== a.count) return b.count - a.count;
          return (
            typeById.get(a.itemTypeId)!.sortOrder -
            typeById.get(b.itemTypeId)!.sortOrder
          );
        })
        .map((row) => ({
          type: toCollectionType(typeById.get(row.itemTypeId)!),
          count: row.count,
        })),
    );
  }

  return ranked;
}

/**
 * The type a collection holds most of. A tie goes to the collection's default
 * type when that type is among the tied, per the card color rule in
 * context/project-overview.md §11.
 */
function pickDominantType(
  ranked: RankedType[],
  defaultTypeId: string | null,
): CollectionType | null {
  const topCount = ranked[0]?.count ?? 0;
  const tied = ranked.filter((row) => row.count === topCount);

  const dominant =
    tied.find((row) => row.type.id === defaultTypeId) ?? tied[0];

  return dominant?.type ?? null;
}

function toCollectionType(type: {
  id: string;
  name: string;
  slug: string;
  icon: string;
}): CollectionType {
  return { id: type.id, name: type.name, slug: type.slug, icon: type.icon };
}
