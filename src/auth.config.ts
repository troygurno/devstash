import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

import type { NextAuthConfig } from "next-auth";
import type { CredentialInput } from "next-auth/providers";

/**
 * The email and password fields the built-in `/api/auth/signin` page renders.
 *
 * Exported because `auth.ts` rebuilds the Credentials provider to attach the real
 * `authorize`, and both instances have to describe the same form.
 */
export const CREDENTIAL_FIELDS = {
  email: { label: "Email", type: "email" },
  password: { label: "Password", type: "password" },
} satisfies Record<string, CredentialInput>;

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
  providers: [
    GitHub,
    Credentials({
      credentials: CREDENTIAL_FIELDS,
      /**
       * Placeholder. `auth.ts` swaps this provider out for one carrying the real
       * bcrypt check — it does not patch this object, because it cannot. See the
       * note there.
       *
       * It has to reject rather than accept: `proxy.ts` builds its own instance
       * from this config, and a permissive stub there would authenticate anyone
       * against the route guard. Returning `null` keeps the un-overridden provider
       * inert wherever it is reached without the adapter.
       */
      authorize: () => null,
    }),
  ],
} satisfies NextAuthConfig;

export default authConfig;
