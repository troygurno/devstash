/**
 * Current-user resolution.
 *
 * Auth.js isn't wired up yet, so there is no session to read and no way to know
 * who is looking at the page. Every server component that needs "the current
 * user" goes through here, so swapping in `auth()` later is a change to one
 * function rather than a sweep across every query.
 */
import { cache } from "react";

import { prisma } from "@/lib/prisma";

/** The demo account seeded by prisma/seed.ts. */
const DEMO_USER_EMAIL = "demo@devstash.io";

/** What the sidebar footer needs to render an account row. */
export interface CurrentUser {
  id: string;
  /** Null for an account created by OAuth without a profile name. */
  name: string | null;
  email: string;
  image: string | null;
}

/**
 * Null on an unseeded database — callers render their empty state.
 *
 * Wrapped in React's `cache` so the layout and the page share one query per
 * request. Prisma has no request-level deduplication of its own — in Next 16 only
 * `fetch` gets that — and both `AppSidebar` (from the layout) and the dashboard
 * page ask for the current user on every render. The four display columns cost
 * far less than the second round trip they replace, so there is one resolver
 * rather than a narrow and a wide one.
 *
 * The wrapper survives the swap to `auth()`: the caching stays useful, only the
 * lookup underneath changes.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  return prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true, name: true, email: true, image: true },
  });
});

/** The current user's id alone. Shares `getCurrentUser`'s cached result. */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();

  return user?.id ?? null;
}
