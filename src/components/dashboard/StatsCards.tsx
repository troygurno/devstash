import { Folder, FolderHeart, Layers, Star } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { mockCollections, mockItemTypes, mockItems } from "@/lib/mock-data";

/**
 * "Total items" sums the per-type counts rather than `mockItems.length`. The sample
 * array holds 14 rows while the type counts total 85, and the sidebar renders those
 * same per-type counts alongside this card — a total of 14 next to a sidebar reading
 * "Snippets 24" reads as a bug. The other three stats have no such conflict and come
 * straight off the arrays.
 */
const STATS = [
  {
    label: "Items",
    value: mockItemTypes.reduce((total, type) => total + type.itemCount, 0),
    icon: Layers,
    className: "text-blue-500",
  },
  {
    label: "Collections",
    value: mockCollections.length,
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
    value: mockCollections.filter((collection) => collection.isFavorite).length,
    icon: FolderHeart,
    className: "text-emerald-500",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STATS.map(({ label, value, icon: Icon, className }) => (
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
