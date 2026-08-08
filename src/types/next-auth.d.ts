import type { DefaultSession } from "next-auth";

/**
 * `session.user` ships with name, email, and image only. Every query in
 * `src/lib/db/**` keys on a user id, so the id has to be on the session for the
 * demo-user resolver in `src/lib/db/user.ts` to be replaceable later.
 *
 * The `jwt` and `session` callbacks in `src/auth.ts` are what actually populate
 * these; this file only tells TypeScript they exist.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

/**
 * Augment `@auth/core/jwt`, not `next-auth/jwt`. The latter is a bare
 * `export * from "@auth/core/jwt"`, so `JWT` is not declared in it — augmenting
 * that path silently defines a *second*, unrelated interface and `token.id`
 * stays `unknown` (which narrows to `{}` inside a truthiness check).
 */
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
  }
}
