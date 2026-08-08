import Link from "next/link";
import { ChevronsUpDown, User } from "lucide-react";

import { SignOutMenuItem } from "@/components/auth/SignOutMenuItem";
import { UserAvatar } from "@/components/user/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { CurrentUser } from "@/lib/db/user";

/**
 * The account row and its menu. Falls back to the email everywhere the name is
 * null, which is the OAuth-without-a-profile-name case.
 *
 * Still a server component. The shadcn dropdown primitives are already client
 * modules, so rendering them from here is fine — their children are server
 * rendered and handed across the boundary as props. Only `SignOutMenuItem` needs a
 * handler, so only that is `'use client'`.
 *
 * The row opens the menu and does nothing else. An earlier version paired it with a
 * gear `SidebarMenuAction` linking to `/settings`; that slot is absolutely
 * positioned over the button and would have sat on top of the dropdown trigger, and
 * a row that both navigates and opens a menu is ambiguous anyway. The destination
 * moved into the menu instead.
 */
export function SidebarUser({ user }: { user: CurrentUser }) {
  const displayName = user.name ?? user.email;

  return (
    <SidebarFooter className="border-t border-sidebar-border">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            {/*
              No `tooltip` prop here, and that is load-bearing rather than an
              omission. `SidebarMenuButton` returns a `<Tooltip>` wrapper instead of
              the button whenever `tooltip` is set, so `asChild` would hand the
              trigger's click handler and ref to a context provider that renders no
              DOM element — the menu simply never opens. It typechecks and renders
              fine, which is what makes it worth a comment.

              Nothing is lost: the menu's own label repeats the name and email, so a
              collapsed sidebar still identifies the account on click.
            */}
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg">
                <UserAvatar
                  name={user.name}
                  email={user.email}
                  image={user.image}
                />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">
                    {user.email}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-60" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            {/*
              Opens upward — the footer sits at the bottom of the viewport, so a
              downward menu would be clipped. The trigger-width variable keeps the
              menu aligned with the row while the sidebar is expanded, and the
              `min-w` keeps it readable once it collapses to a 32px icon.
            */}
            <DropdownMenuContent
              side="top"
              align="start"
              sideOffset={8}
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            >
              <DropdownMenuLabel className="flex items-center gap-2 py-2 font-normal">
                <UserAvatar
                  name={user.name}
                  email={user.email}
                  image={user.image}
                />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">
                    {displayName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/*
                `/settings` is the profile page — context/project-overview.md §7
                describes it as "Profile, theme, data export". The spec named a
                `/profile` route the route table does not have, so the label follows
                the spec and the destination follows §7.
              */}
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <User />
                  Profile
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <SignOutMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
