"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SIGN_OUT_REDIRECT_PATH } from "@/lib/auth-routes";

/**
 * The one interactive leaf of the account menu.
 *
 * Everything around it — the trigger, the menu, the account summary — is server
 * rendered; only this needs a handler, so only this crosses the client boundary.
 * `signOut` clears the session cookie through `/api/auth/signout` and broadcasts to
 * other tabs, then redirects.
 *
 * `redirectTo` rather than `callbackUrl`: v5 renamed it, and the old name is
 * silently ignored, which lands the user back on the page they just signed out of.
 */
export function SignOutMenuItem() {
  return (
    <DropdownMenuItem
      onSelect={() => signOut({ redirectTo: SIGN_OUT_REDIRECT_PATH })}
    >
      <LogOut />
      Sign out
    </DropdownMenuItem>
  );
}
