/**
 * Current-user resolution.
 *
 * Every server component that needs "the current user" goes through here. Until
 * auth phase 3 this resolved the seeded demo account by email; it now reads the
 * signed-in user from the Auth.js session, which is the swap that one function
 * existed to absorb.
 */
import { cache } from "react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** What the sidebar footer needs to render an account row. */
export interface CurrentUser {
  id: string;
  /** Null for an account created by OAuth without a profile name. */
  name: string | null;
  email: string;
  image: string | null;
}

/**
 * Null when nobody is signed in, and null when the session names a row that no
 * longer exists — callers render their empty state for both.
 *
 * That second case is real rather than defensive. Sessions are JWTs, so they
 * outlive the row they name: deleting a user does not invalidate their cookie, and
 * the id inside it keeps resolving until the token expires. Reading the row rather
 * than trusting the token's own `name`/`email`/`image` claims also means a profile
 * edit shows up on the next request instead of at the next sign-in.
 *
 * Wrapped in React's `cache` so the layout and the page share one lookup per
 * request. Prisma has no request-level deduplication of its own — in Next 16 only
 * `fetch` gets that — and both `AppSidebar` (from the layout) and the dashboard
 * page ask for the current user on every render.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, image: true },
  });
});

/** The current user's id alone. Shares `getCurrentUser`'s cached result. */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();

  return user?.id ?? null;
}
