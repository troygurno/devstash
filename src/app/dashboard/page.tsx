import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Pin } from "lucide-react";

import { CollectionCard } from "@/components/collections/CollectionCard";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ItemRow } from "@/components/items/ItemRow";
import {
  getCollectionStats,
  getRecentCollections,
  type CollectionStats,
} from "@/lib/db/collections";
import { getCurrentUserId } from "@/lib/db/user";
import { mockItems } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Dashboard · DevStash",
};

const COLLECTION_LIMIT = 6;
const RECENT_ITEM_LIMIT = 10;

const NO_COLLECTIONS: CollectionStats = { total: 0, favorites: 0 };

const pinnedItems = mockItems.filter((item) => item.isPinned);

// Pinned items are excluded rather than repeated — both sections sit on the same
// screen, and dropping the four pinned rows leaves exactly the ten Recent wants.
const recentItems = mockItems
  .filter((item) => !item.isPinned)
  .sort((a, b) => (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""))
  .slice(0, RECENT_ITEM_LIMIT);

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold">
      {Icon ? (
        <Icon aria-hidden className="size-4 text-muted-foreground" />
      ) : null}
      {children}
    </h2>
  );
}

export default async function DashboardPage() {
  // No session yet — getCurrentUserId resolves the seeded demo account and
  // returns null against an unseeded database.
  const userId = await getCurrentUserId();
  const [collections, collectionStats] = await Promise.all([
    userId ? getRecentCollections(userId, COLLECTION_LIMIT) : [],
    userId ? getCollectionStats(userId) : NO_COLLECTIONS,
  ]);

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Your developer knowledge hub</p>
      </div>

      <StatsCards collections={collectionStats} />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <SectionHeading>Collections</SectionHeading>
          <Link
            href="/collections"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        {collections.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No collections yet. Group related items into a collection to keep
              them together.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Pin}>Pinned</SectionHeading>
        <div className="space-y-3">
          {pinnedItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeading icon={Clock}>Recent</SectionHeading>
        <div className="space-y-3">
          {recentItems.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
