import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import { prisma } from "@/lib/prisma";

import authConfig from "./auth.config";

/**
 * The full Auth.js instance: the shared providers from `auth.config.ts` plus the
 * Prisma adapter.
 *
 * The session strategy has to be `jwt`. Auth.js v5's Credentials provider — which
 * phase 2 adds for email/password — cannot use database sessions, and switching
 * strategies after session-dependent features exist is a rewrite. See
 * `context/project-overview.md` §9.
 *
 * A consequence worth knowing: the adapter still writes `User` and `Account` rows
 * on first sign-in, but the `Session` table stays empty by design.
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      // `user` is only populated on the sign-in pass; later calls re-read the token.
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      // `session.user.id` is typed non-optional, so a single-source guarded
      // assignment could hand `undefined` to callers under a `string` type.
      // `sub` is NextAuth's own copy of the user id on a JWT session, which
      // makes the pair genuinely exhaustive rather than merely likely.
      const id = token.id ?? token.sub;
      if (id) {
        session.user.id = id;
      }
      return session;
    },
  },
});
