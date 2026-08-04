import Link from "next/link";
import { Pin, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatShortDate } from "@/lib/format";
import {
  getItemTypeBgClass,
  getItemTypeBorderClass,
  getItemTypeColorClass,
  getItemTypeIcon,
} from "@/lib/item-types";
import { cn } from "@/lib/utils";
import type { DashboardItem } from "@/lib/db/items";

/**
 * Resolving the icon inside the component body reads as a component created during
 * render to `react-hooks/static-components`, even though the map it comes from is
 * static. Returning the element from a plain function sidesteps that.
 */
function renderTypeIcon(iconName: string, className: string) {
  const Icon = getItemTypeIcon(iconName);
  return <Icon aria-hidden="true" className={className} />;
}

/**
 * The date on the right is `createdAt`, matching the reference screenshot — the
 * pinned "API Error Handling Pattern" row reads Jan 12 there, its creation date,
 * not its Jan 20 update.
 */
export function ItemRow({ item }: { item: DashboardItem }) {
  const { type } = item;

  return (
    <Card
      className={cn(
        "border-l-4 transition-colors hover:ring-foreground/20",
        getItemTypeBorderClass(type.slug),
      )}
    >
      <CardContent className="flex items-start gap-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            getItemTypeBgClass(type.slug),
          )}
        >
          {renderTypeIcon(
            type.icon,
            cn("size-5", getItemTypeColorClass(type.slug)),
          )}
        </span>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/items/${item.id}`}
              className="truncate font-medium hover:underline"
            >
              {item.title}
            </Link>
            {item.isPinned ? (
              <Pin
                aria-label="Pinned"
                className="size-3.5 shrink-0 text-muted-foreground"
              />
            ) : null}
            {item.isFavorite ? (
              <Star
                aria-label="Favorite"
                className="size-3.5 shrink-0 fill-amber-400 text-amber-400"
              />
            ) : null}
          </div>

          {item.description ? (
            <p className="truncate text-sm text-muted-foreground">
              {item.description}
            </p>
          ) : null}

          {item.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <time
          dateTime={item.createdAt.toISOString()}
          className="shrink-0 text-xs text-muted-foreground"
        >
          {formatShortDate(item.createdAt)}
        </time>
      </CardContent>
    </Card>
  );
}
