import Link from "next/link";
import { ChevronDown, Folder, Layers, Settings, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { getItemTypeColorClass, getItemTypeIcon } from "@/lib/item-types";
import {
  mockCollections,
  mockItemTypes,
  mockUser,
  type MockCollection,
} from "@/lib/mock-data";

const RECENT_COLLECTION_COUNT = 5;

const favoriteCollections = mockCollections.filter(
  (collection) => collection.isFavorite,
);

// Recent spans every collection, so a favorite can appear in both groups.
const recentCollections = [...mockCollections]
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  .slice(0, RECENT_COLLECTION_COUNT);

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

function CollectionMenuItem({
  collection,
  showStar,
}: {
  collection: MockCollection;
  showStar: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={collection.name}>
        <Link href={`/collections/${collection.id}`}>
          <Folder />
          <span>{collection.name}</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuBadge>
        {showStar ? (
          <Star
            aria-label="Favorite"
            className="size-3.5 fill-amber-400 text-amber-400"
          />
        ) : (
          collection.itemCount
        )}
      </SidebarMenuBadge>
    </SidebarMenuItem>
  );
}

/**
 * Reads straight from mock-data for now. Every href here is correct per the route
 * table in context/project-overview.md but points at a page that doesn't exist yet.
 */
export function AppSidebar() {
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
                  {mockItemTypes.map((type) => {
                    const Icon = getItemTypeIcon(type.icon);
                    return (
                      <SidebarMenuItem key={type.id}>
                        <SidebarMenuButton asChild tooltip={type.name}>
                          <Link href={`/items/${type.slug}`}>
                            <Icon className={getItemTypeColorClass(type.slug)} />
                            <span>{type.name}</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuBadge>{type.itemCount}</SidebarMenuBadge>
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
                <SidebarMenu>
                  {favoriteCollections.map((collection) => (
                    <CollectionMenuItem
                      key={collection.id}
                      collection={collection}
                      showStar
                    />
                  ))}
                </SidebarMenu>

                <SubGroupLabel>Recent</SubGroupLabel>
                <SidebarMenu>
                  {recentCollections.map((collection) => (
                    <CollectionMenuItem
                      key={collection.id}
                      collection={collection}
                      showStar={false}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={mockUser.name}>
              <Avatar className="size-8 rounded-full">
                {mockUser.image ? (
                  <AvatarImage src={mockUser.image} alt="" />
                ) : null}
                <AvatarFallback className="rounded-full text-xs">
                  {getInitials(mockUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-medium">{mockUser.name}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  {mockUser.email}
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

      <SidebarRail />
    </Sidebar>
  );
}
