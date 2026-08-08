import GitHub from "next-auth/providers/github";

import type { NextAuthConfig } from "next-auth";

/**
 * Shared Auth.js configuration — everything except the database adapter.
 *
 * The adapter lives in `auth.ts` alone so this object stays free of the Prisma
 * client and the Neon driver. `proxy.ts` imports the instance built from *this*
 * config, so route protection never pulls the database layer into its bundle.
 *
 * `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` are read by name automatically — the
 * `AUTH_<PROVIDER>_ID` convention means the provider needs no arguments.
 */
export const authConfig = {
  providers: [GitHub],
} satisfies NextAuthConfig;

export default authConfig;
