/**
 * Current-user resolution.
 *
 * Auth.js isn't wired up yet, so there is no session to read and no way to know
 * who is looking at the page. Every server component that needs "the current
 * user" goes through here, so swapping in `auth()` later is a change to one
 * function rather than a sweep across every query.
 */
import { prisma } from "@/lib/prisma";

/** The demo account seeded by prisma/seed.ts. */
const DEMO_USER_EMAIL = "demo@devstash.io";

/** Null on an unseeded database — callers render their empty state. */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true },
  });

  return user?.id ?? null;
}
