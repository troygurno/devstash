import { Folder, FolderHeart, Layers, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { CollectionStats } from "@/lib/db/collections";
import { mockItemTypes, mockItems } from "@/lib/mock-data";

/**
 * The two collection figures are real; the two item figures are still mock data,
 * because items haven't moved off `mock-data.ts` yet. Until they do, "Items 85"
 * sits next to a real "Collections 5" — expected, not a bug.
 *
 * "Total items" sums the per-type counts rather than `mockItems.length`. The
 * sample array holds 14 rows while the type counts total 85, and the sidebar
 * renders those same per-type counts alongside this card.
 */
export function StatsCards({ collections }: { collections: CollectionStats }) {
  const stats = [
    {
      label: "Items",
      value: mockItemTypes.reduce((total, type) => total + type.itemCount, 0),
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
      value: mockItems.filter((item) => item.isFavorite).length,
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
