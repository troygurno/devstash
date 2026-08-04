import Link from "next/link";
import { Star } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardCollection } from "@/lib/db/collections";
import {
  getItemTypeBorderClass,
  getItemTypeColorClass,
  getItemTypeIcon,
} from "@/lib/item-types";
import { cn } from "@/lib/utils";

/**
 * The accent stripe comes from `dominantType` — the type the collection holds
 * most of, resolved by a grouped count in the query. An empty collection has no
 * dominant type and falls back to the neutral border.
 */
export function CollectionCard({
  collection,
}: {
  collection: DashboardCollection;
}) {
  return (
    <Card
      className={cn(
        "border-l-4 transition-colors hover:ring-foreground/20",
        getItemTypeBorderClass(collection.dominantType?.slug ?? ""),
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Link href={`/collections/${collection.id}`} className="truncate">
            {collection.name}
          </Link>
          {collection.isFavorite ? (
            <Star
              aria-label="Favorite"
              className="size-4 shrink-0 fill-amber-400 text-amber-400"
            />
          ) : null}
        </CardTitle>
        <CardDescription>
          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {collection.description ? (
          <p className="text-sm text-muted-foreground">
            {collection.description}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          {collection.types.map((type) => {
            const Icon = getItemTypeIcon(type.icon);
            return (
              <Icon
                key={type.id}
                aria-label={type.name}
                className={cn("size-4", getItemTypeColorClass(type.slug))}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
