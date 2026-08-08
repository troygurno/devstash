import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

import { SIGN_IN_PATH } from "@/lib/auth-routes";

import type { NextAuthConfig } from "next-auth";
import type { CredentialInput } from "next-auth/providers";

/**
 * The email and password fields the Credentials provider accepts.
 *
 * Nothing renders them now that `pages.signIn` points at a custom page —
 * `src/components/auth/SignInForm.tsx` owns the markup. They stay because the
 * provider still declares its input shape, and because `auth.ts` rebuilds the
 * provider to attach the real `authorize`; both instances have to agree.
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
  /**
   * Send every Auth.js redirect to the custom page instead of the built-in one at
   * `/api/auth/signin`. This lives in the shared config rather than in `auth.ts`
   * so `proxy.ts` — which builds its own instance from this object — agrees about
   * where an unauthenticated request goes.
   *
   * It also sets where provider errors land: a failed GitHub handoff arrives at
   * `/sign-in?error=…` rather than at Auth.js's own error page.
   */
  pages: {
    signIn: SIGN_IN_PATH,
    error: SIGN_IN_PATH,
  },
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
