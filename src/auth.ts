import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validations/auth";

import authConfig, { CREDENTIAL_FIELDS } from "./auth.config";

import type { User } from "next-auth";

/**
 * A valid bcrypt hash of a random string nobody holds the input to.
 *
 * `authorize` compares against it when no account matches, so an unregistered email
 * pays the same bcrypt cost as a registered one with the wrong password. Returning
 * early instead would leak which emails exist through response time alone.
 *
 * Measured over the dev server: wrong password 956ms, OAuth-only account 946ms,
 * unknown email 898ms — indistinguishable. A malformed request still short-circuits
 * at the schema (~28ms), which reveals nothing about which accounts exist.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$12$7ibGtpVZnXxuyiGU7HTBmuUweGOqedFcavV.z7HMfbfB4xQDIZQmq";

/**
 * The real Credentials check, kept out of `auth.config.ts` so bcrypt and the
 * Prisma client stay out of the bundle `proxy.ts` builds.
 *
 * Returns `null` for every failure — a bad email, a bad password, and an
 * OAuth-only account are indistinguishable to the caller by design.
 */
async function authorizeCredentials(
  credentials: Partial<Record<string, unknown>>,
): Promise<User | null> {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      passwordHash: true,
    },
  });

  // No such user, or a GitHub-only account that has never set a password.
  if (!user?.passwordHash) {
    await compare(password, DUMMY_PASSWORD_HASH);
    return null;
  }

  if (!(await compare(password, user.passwordHash))) return null;

  // Never spread `user` — that would put `passwordHash` on the returned object
  // and from there into the JWT callback.
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  };
}

/**
 * The full Auth.js instance: the shared providers from `auth.config.ts` plus the
 * Prisma adapter.
 *
 * The session strategy has to be `jwt`. Auth.js v5's Credentials provider cannot
 * use database sessions, and switching strategies after session-dependent features
 * exist is a rewrite. See `context/project-overview.md` §9.
 *
 * A consequence worth knowing: the adapter still writes `User` and `Account` rows
 * on a GitHub sign-in, but the `Session` table stays empty by design. Credentials
 * sign-in touches neither — Auth.js never calls `adapter.createUser` for it, which
 * is why `/api/auth/register` has to create the row itself.
 */
export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  /**
   * Replace the placeholder provider with one carrying the real check, leaving
   * GitHub as it comes from the shared config.
   *
   * **This has to build a new provider — patching the existing one does nothing.**
   * `Credentials(config)` returns `{ …defaults, authorize: () => null, options: config }`,
   * stashing the caller's object under `options`. Auth.js then resolves it with
   * `merge(defaults, userOptions, …)` (`@auth/core/lib/utils/providers.js`), so
   * `options.authorize` — the placeholder from `auth.config.ts` — is applied *over*
   * anything set at the top level. A `{ ...provider, authorize }` spread therefore
   * typechecks, looks correct, and is silently discarded at request time; the only
   * symptom is `error=CredentialsSignin` on every valid password.
   *
   * `GitHub` is passed to the shared config uncalled, so the array holds a
   * *function* beside the credentials object — hence the `typeof` guard.
   */
  providers: authConfig.providers.map((provider) =>
    typeof provider === "function" || provider.type !== "credentials"
      ? provider
      : Credentials({
          credentials: CREDENTIAL_FIELDS,
          authorize: authorizeCredentials,
        }),
  ),
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
