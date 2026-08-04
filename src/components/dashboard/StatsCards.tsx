import { Folder, FolderHeart, Layers, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { CollectionStats } from "@/lib/db/collections";
import type { ItemStats } from "@/lib/db/items";

/** All four figures are real counts, matching the sidebar's per-type totals. */
export function StatsCards({
  items,
  collections,
}: {
  items: ItemStats;
  collections: CollectionStats;
}) {
  const stats = [
    {
      label: "Items",
      value: items.total,
      icon: Layers,
      className: "text-blue-500",
    },
    {
      label: "Collections",
      value: collections.total,
      icon: Folder,
      className: "text-violet-500",
    },
    {
      label: "Favorite Items",
      value: items.favorites,
      icon: Star,
      className: "text-amber-400",
    },
    {
      label: "Favorite Collections",
      value: collections.favorites,
      icon: FolderHeart,
      className: "text-emerald-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, className }) => (
        <Card key={label}>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
            </div>
            <Icon aria-hidden="true" className={`size-5 ${className}`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
