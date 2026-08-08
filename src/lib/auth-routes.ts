/**
 * Auth route paths and post-sign-in redirect handling.
 *
 * Deliberately dependency-free. `auth.config.ts` imports `SIGN_IN_PATH`, and that
 * file's whole reason for existing is that `proxy.ts` builds an Auth.js instance
 * from it without dragging in Prisma, bcrypt, or Zod. Anything imported here ends
 * up in the proxy bundle.
 */

export const SIGN_IN_PATH = "/sign-in";
export const REGISTER_PATH = "/register";

/** Where a signed-in user belongs when no callback was requested. */
export const DEFAULT_SIGNED_IN_PATH = "/dashboard";

/** Where signing out lands. */
export const SIGN_OUT_REDIRECT_PATH = SIGN_IN_PATH;

/**
 * Reduce a `callbackUrl` query parameter to a path this app can navigate to.
 *
 * The credentials form signs in with `redirect: false` and pushes the callback
 * itself, which means Auth.js's own same-origin check on `redirectTo` never runs.
 * Without this, `/sign-in?callbackUrl=https://evil.example` would be an open
 * redirect off the back of a successful login.
 *
 * Absolute URLs keep their path and lose their origin — `proxy.ts` sets the full
 * `req.nextUrl.href`, so that is the ordinary case, not the attack. A
 * protocol-relative `//evil.example` is rejected outright: it starts with `/` but
 * `router.push` would treat it as a different host.
 */
export function toInternalPath(
  raw: string | null | undefined,
  fallback: string = DEFAULT_SIGNED_IN_PATH,
): string {
  if (!raw) return fallback;

  if (raw.startsWith("/")) {
    return raw.startsWith("//") ? fallback : raw;
  }

  try {
    const url = new URL(raw);
    return `${url.pathname}${url.search}${url.hash}` || fallback;
  } catch {
    return fallback;
  }
}
