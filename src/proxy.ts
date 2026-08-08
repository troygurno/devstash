import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { SIGN_IN_PATH } from "@/lib/auth-routes";

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

  // The custom page. `SIGN_IN_PATH` is also `pages.signIn` in the shared config,
  // so this redirect and Auth.js's own agree by construction rather than by
  // two string literals happening to match.
  const signInUrl = new URL(SIGN_IN_PATH, req.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);

  return NextResponse.redirect(signInUrl);
});

/**
 * Only the dashboard. `/sign-in`, `/register`, and `/api/auth/*` are deliberately
 * outside the matcher — guarding the sign-in route with the thing that redirects to
 * it is an infinite loop. `:path*` matches zero segments too, so bare `/dashboard`
 * is covered.
 */
export const config = {
  matcher: ["/dashboard/:path*"],
};
