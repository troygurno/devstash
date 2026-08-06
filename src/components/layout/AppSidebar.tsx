import Link from "next/link";
import { Layers } from "lucide-react";

import { CollectionsGroup } from "@/components/layout/sidebar/CollectionsGroup";
import { SidebarUser } from "@/components/layout/sidebar/SidebarUser";
import { TypesGroup } from "@/components/layout/sidebar/TypesGroup";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  getSidebarCollections,
  type SidebarCollections,
} from "@/lib/db/collections";
import { getItemTypeCounts } from "@/lib/db/items";
import { getCurrentUser } from "@/lib/db/user";

const RECENT_COLLECTION_COUNT = 5;
const FAVORITE_COLLECTION_COUNT = 5;

const NO_COLLECTIONS: SidebarCollections = { favorites: [], recent: [] };

/**
 * Reads from Postgres via the demo account — there's no session yet, so an
 * unseeded database renders the groups empty rather than failing. Every href is
 * correct per the route table in context/project-overview.md, but /items and
 * /collections don't exist yet.
 *
 * This is the data-fetching shell only; the three sections are pure
 * presentational server components under sidebar/.
 */
export async function AppSidebar() {
  const user = await getCurrentUser();
  const [types, collections] = await Promise.all([
    user ? getItemTypeCounts(user.id) : [],
    user
      ? getSidebarCollections(
          user.id,
          RECENT_COLLECTION_COUNT,
          FAVORITE_COLLECTION_COUNT,
        )
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
        <TypesGroup types={types} />
        <CollectionsGroup collections={collections} />
      </SidebarContent>

      {user ? <SidebarUser user={user} /> : null}

      <SidebarRail />
    </Sidebar>
  );
}
