import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import type { ItemTypeCount } from "@/lib/db/items";
import {
  getItemTypeColorClass,
  getItemTypeIcon,
  getItemTypePluralLabel,
  isProItemType,
} from "@/lib/item-types";

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
 * The Types section: one row per item type with its count, or a PRO badge where
 * the type is Pro-gated. The badge slot holds one thing, so a gated type shows
 * the badge instead of its count.
 */
export function TypesGroup({ types }: { types: ItemTypeCount[] }) {
  return (
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
                      {isProItemType(type.slug) ? <ProBadge /> : type.count}
                    </SidebarMenuBadge>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
