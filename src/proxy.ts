import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "./auth.config";

/**
 * Route protection for `/dashboard/*`.
 *
 * Next 16 renamed `middleware.ts` to `proxy.ts` and the exported function with it.
 * The file sits beside `app/`, not inside it.
 *
 * This builds its own Auth.js instance from the adapter-free config rather than
 * importing `auth` from `@/auth`, so the Prisma client and the Neon driver never
 * reach this bundle. Auth.js documents that split as an edge-runtime workaround;
 * Next 16's proxy actually runs on Node, so the split buys bundle size here rather
 * than raw compatibility. Phase 2's Credentials provider makes it matter again —
 * bcrypt has no business in a request filter.
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  if (req.auth) return;

  // NextAuth's built-in sign-in page — no custom `pages.signIn` this phase.
  const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);

  return NextResponse.redirect(signInUrl);
});

/**
 * Only the dashboard. `/api/auth/*` is deliberately outside the matcher — guarding
 * the sign-in route with the thing that redirects to it is an infinite loop.
 * `:path*` matches zero segments too, so bare `/dashboard` is covered.
 */
export const config = {
  matcher: ["/dashboard/:path*"],
};
