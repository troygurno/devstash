import Link from "next/link";
import { ChevronDown, Folder, Folders, Star } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type {
  CollectionType,
  SidebarCollection,
  SidebarCollections,
} from "@/lib/db/collections";
import { getItemTypeDotClass } from "@/lib/item-types";
import { cn } from "@/lib/utils";

/** Uppercase label for a group inside the Collections section. */
function SubGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 py-1.5 text-[0.7rem] font-medium tracking-wider text-sidebar-foreground/50 uppercase group-data-[collapsible=icon]:hidden">
      {children}
    </p>
  );
}

/** Sits where the count badge would, hidden with the rest in icon mode. */
function EmptyGroupNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 py-1 text-xs text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
      {children}
    </p>
  );
}

/**
 * The type a collection holds most of. Neutral when it holds nothing — matching
 * how CollectionCard falls back on the same null.
 */
function DominantTypeDot({ type }: { type: CollectionType | null }) {
  return (
    <span
      role={type ? "img" : undefined}
      aria-label={type?.name}
      aria-hidden={type ? undefined : true}
      className={cn(
        "size-2 rounded-full",
        getItemTypeDotClass(type?.slug ?? ""),
      )}
    />
  );
}

function CollectionMenuItem({
  collection,
  badge,
}: {
  collection: SidebarCollection;
  badge: React.ReactNode;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={collection.name}>
        <Link href={`/collections/${collection.id}`}>
          <Folder />
          <span>{collection.name}</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuBadge>{badge}</SidebarMenuBadge>
    </SidebarMenuItem>
  );
}

/**
 * The Collections section: starred collections first, then the most recently
 * updated. Both lists are capped by the query, so "View all collections" at the
 * bottom is the overflow for either.
 */
export function CollectionsGroup({
  collections,
}: {
  collections: SidebarCollections;
}) {
  return (
    <Collapsible defaultOpen className="group/collections">
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="w-full">
            Collections
            <ChevronDown className="ml-auto transition-transform group-data-[state=closed]/collections:-rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SubGroupLabel>Favorites</SubGroupLabel>
            {collections.favorites.length > 0 ? (
              <SidebarMenu>
                {collections.favorites.map((collection) => (
                  <CollectionMenuItem
                    key={collection.id}
                    collection={collection}
                    badge={
                      <Star
                        aria-label="Favorite"
                        className="size-3.5 fill-amber-400 text-amber-400"
                      />
                    }
                  />
                ))}
              </SidebarMenu>
            ) : (
              <EmptyGroupNote>Star a collection to pin it here.</EmptyGroupNote>
            )}

            <SubGroupLabel>Recent</SubGroupLabel>
            {collections.recent.length > 0 ? (
              <SidebarMenu>
                {collections.recent.map((collection) => (
                  <CollectionMenuItem
                    key={collection.id}
                    collection={collection}
                    badge={<DominantTypeDot type={collection.dominantType} />}
                  />
                ))}
              </SidebarMenu>
            ) : (
              <EmptyGroupNote>No collections yet.</EmptyGroupNote>
            )}

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="View all collections"
                  className="text-sidebar-foreground/70"
                >
                  <Link href="/collections">
                    <Folders />
                    <span>View all collections</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
