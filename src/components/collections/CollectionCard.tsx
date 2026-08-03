import Link from "next/link";
import { Star } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getItemTypeBorderClass,
  getItemTypeColorClass,
  getItemTypeIcon,
} from "@/lib/item-types";
import { cn } from "@/lib/utils";
import { mockItemTypesById, type MockCollection } from "@/lib/mock-data";

/**
 * The accent stripe comes from `dominantTypeId`, which the mock data carries
 * directly. Against a real database this is a grouped count in the query, not a
 * client-side tally — see the collection card color rule in project-overview.md.
 */
export function CollectionCard({
  collection,
}: {
  collection: MockCollection;
}) {
  const dominantType = mockItemTypesById[collection.dominantTypeId];

  return (
    <Card
      className={cn(
        "border-l-4 transition-colors hover:ring-foreground/20",
        getItemTypeBorderClass(dominantType?.slug ?? ""),
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
        <CardDescription>{collection.itemCount} items</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {collection.description}
        </p>
        <div className="flex items-center gap-2">
          {collection.typeIds.map((typeId) => {
            const type = mockItemTypesById[typeId];
            if (!type) return null;
            const Icon = getItemTypeIcon(type.icon);
            return (
              <Icon
                key={typeId}
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
