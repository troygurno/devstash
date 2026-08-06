import Link from "next/link";
import { Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { CurrentUser } from "@/lib/db/user";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * The account row. Falls back to the email everywhere the name is null, which is
 * the OAuth-without-a-profile-name case.
 */
export function SidebarUser({ user }: { user: CurrentUser }) {
  return (
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
  );
}
