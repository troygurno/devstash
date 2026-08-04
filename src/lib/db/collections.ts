/**
 * Collection queries for the dashboard.
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
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      defaultTypeId: true,
      updatedAt: true,
    },
  });

  if (collections.length === 0) return [];

  const collectionIds = collections.map((collection) => collection.id);

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

  return collections.map((collection) => {
    const rows = rowsByCollection.get(collection.id) ?? [];

    // Most-used first; sortOrder breaks count ties so the icon row and the
    // dominant type don't reshuffle between requests.
    const ranked = rows
      .filter((row) => typeById.has(row.itemTypeId))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        const orderA = typeById.get(a.itemTypeId)!.sortOrder;
        const orderB = typeById.get(b.itemTypeId)!.sortOrder;
        return orderA - orderB;
      });

    // A tie goes to the collection's default type when that type is among the
    // tied, per the card color rule in context/project-overview.md §11.
    const topCount = ranked[0]?.count ?? 0;
    const tied = ranked.filter((row) => row.count === topCount);
    const dominantRow =
      tied.find((row) => row.itemTypeId === collection.defaultTypeId) ?? tied[0];

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      itemCount: ranked.reduce((total, row) => total + row.count, 0),
      dominantType: dominantRow ? toCollectionType(typeById.get(dominantRow.itemTypeId)!) : null,
      types: ranked.map((row) => toCollectionType(typeById.get(row.itemTypeId)!)),
      updatedAt: collection.updatedAt,
    };
  });
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

function toCollectionType(type: {
  id: string;
  name: string;
  slug: string;
  icon: string;
}): CollectionType {
  return { id: type.id, name: type.name, slug: type.slug, icon: type.icon };
}
