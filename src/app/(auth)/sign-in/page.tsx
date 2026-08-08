import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/SignInForm";
import { authErrorMessage } from "@/lib/auth-errors";
import { DEFAULT_SIGNED_IN_PATH, toInternalPath } from "@/lib/auth-routes";
import { getCurrentUser } from "@/lib/db/user";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in · DevStash",
};

interface SignInPageProps {
  // Next 16: `searchParams` is a Promise.
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    registered?: string;
  }>;
}

/**
 * `/sign-in` — replaces the built-in page at `/api/auth/signin`.
 *
 * A server component. `callbackUrl` is read here rather than with
 * `useSearchParams` in the form, which keeps the query string out of the client
 * bundle's concerns and lets it be sanitized before it reaches anything that
 * navigates: the form signs in with `redirect: false` and pushes the callback
 * itself, so Auth.js's own same-origin check never runs on it.
 */
export default async function SignInPage({ searchParams }: SignInPageProps) {
  const user = await getCurrentUser();
  const { callbackUrl, error, registered } = await searchParams;

  // Nobody signed in belongs on a sign-in form. Honor the callback so a session
  // that arrived mid-flow still lands where it was heading.
  //
  // This has to test the *user*, not `auth()`. A session naming a deleted row is
  // truthy while the dashboard layout rejects it, and gating on the session alone
  // would bounce such a request between the two pages forever. Resolving the row
  // means a stale cookie lands here and gets the form, which is the one thing that
  // can replace it.
  if (user) {
    redirect(toInternalPath(callbackUrl));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your DevStash account
        </p>
      </div>

      <SignInForm
        callbackUrl={toInternalPath(callbackUrl, DEFAULT_SIGNED_IN_PATH)}
        initialError={authErrorMessage(error)}
        notice={
          registered ? "Account created. Sign in to get started." : null
        }
      />
    </div>
  );
}
