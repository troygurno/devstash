/**
 * Auth.js error codes → text a user can act on.
 *
 * Codes arrive as `?error=` on the sign-in page: `pages.error` points there, so a
 * failed provider handoff lands on the form rather than on Auth.js's own error page.
 */

/**
 * `CredentialsSignin` deliberately has no specific message. `authorize` in
 * `src/auth.ts` returns null identically for an unknown email, a wrong password, and
 * a GitHub-only account with no password set, and equalizes its timing so the three
 * are indistinguishable. Naming which one failed here would hand back exactly the
 * account-existence signal that code pays for.
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Incorrect email or password.",
  OAuthSignin: "Could not start sign-in with GitHub. Please try again.",
  OAuthCallback: "GitHub could not complete sign-in. Please try again.",
  OAuthAccountNotLinked:
    "An account with that email already exists. Sign in with your email and password instead.",
  AccessDenied: "You do not have access to this application.",
  Verification: "That sign-in link has expired or has already been used.",
  Configuration:
    "Sign-in is misconfigured on the server. Please try again later.",
};

const FALLBACK_MESSAGE = "Could not sign you in. Please try again.";

export function authErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;

  return AUTH_ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
}
