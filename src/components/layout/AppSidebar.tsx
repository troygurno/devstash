import Link from "next/link";
import { ChevronDown, Folder, Folders, Layers, Settings, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  getSidebarCollections,
  type CollectionType,
  type SidebarCollection,
  type SidebarCollections,
} from "@/lib/db/collections";
import { getItemTypeCounts } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";
import {
  getItemTypeColorClass,
  getItemTypeDotClass,
  getItemTypeIcon,
  getItemTypePluralLabel,
  isProItemType,
} from "@/lib/item-types";
import { cn } from "@/lib/utils";

const RECENT_COLLECTION_COUNT = 5;

const NO_COLLECTIONS: SidebarCollections = { favorites: [], recent: [] };

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

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
 * Marks a Pro-gated type. Sized down from the card-scale default, and dimmed
 * with `opacity` rather than a fixed text color so it inherits the badge slot's
 * color — including the brightening the slot does on row hover, which a color of
 * its own would opt out of. `role="img"` is what makes the label reach a screen
 * reader: `aria-label` alone on a roleless element is ignored, and "PRO" would
 * otherwise be announced as a bare token mid-list.
 */
function ProBadge() {
  return (
    <Badge
      variant="outline"
      role="img"
      aria-label="Pro feature"
      className="h-4 border-sidebar-border px-1.5 text-[0.625rem] font-semibold tracking-wide text-inherit opacity-60"
    >
      PRO
    </Badge>
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
 * Reads from Postgres via the demo account — there's no session yet, so an
 * unseeded database renders the groups empty rather than failing. Every href is
 * correct per the route table in context/project-overview.md, but /items and
 * /collections don't exist yet.
 */
export async function AppSidebar() {
  const user = await getCurrentUser();
  const [types, collections] = await Promise.all([
    user ? getItemTypeCounts(user.id) : [],
    user
      ? getSidebarCollections(user.id, RECENT_COLLECTION_COUNT)
      : NO_COLLECTIONS,
  ]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2 px-1">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
            <Layers className="size-4" />
          </span>
          <span className="truncate text-base font-semibold group-data-[collapsible=icon]:hidden">
            DevStash
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <Collapsible defaultOpen className="group/types">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="w-full">
                Types
                <ChevronDown className="ml-auto transition-transform group-data-[state=closed]/types:-rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {types.map((type) => {
                    const Icon = getItemTypeIcon(type.icon);
                    const label = getItemTypePluralLabel(type.slug, type.name);
                    return (
                      <SidebarMenuItem key={type.id}>
                        <SidebarMenuButton asChild tooltip={label}>
                          <Link href={`/items/${type.slug}`}>
                            <Icon className={getItemTypeColorClass(type.slug)} />
                            <span>{label}</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuBadge>
                          {isProItemType(type.slug) ? (
                            <ProBadge />
                          ) : (
                            type.count
                          )}
                        </SidebarMenuBadge>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

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
                  <EmptyGroupNote>
                    Star a collection to pin it here.
                  </EmptyGroupNote>
                )}

                <SubGroupLabel>Recent</SubGroupLabel>
                {collections.recent.length > 0 ? (
                  <SidebarMenu>
                    {collections.recent.map((collection) => (
                      <CollectionMenuItem
                        key={collection.id}
                        collection={collection}
                        badge={
                          <DominantTypeDot type={collection.dominantType} />
                        }
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
      </SidebarContent>

      {user ? (
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" tooltip={user.name ?? user.email}>
                <Avatar className="size-8 rounded-full">
                  {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                  <AvatarFallback className="rounded-full text-xs">
                    {getInitials(user.name ?? user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">
                    {user.name ?? user.email}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/60">
                    {user.email}
                  </span>
                </div>
              </SidebarMenuButton>
              <SidebarMenuAction asChild>
                <Link href="/settings" aria-label="Settings">
                  <Settings />
                </Link>
              </SidebarMenuAction>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      ) : null}

      <SidebarRail />
    </Sidebar>
  );
}
