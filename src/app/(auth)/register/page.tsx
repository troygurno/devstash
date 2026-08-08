import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/auth-routes";
import { getCurrentUser } from "@/lib/db/user";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an account · DevStash",
};

/**
 * `/register` — the UI over the `POST /api/auth/register` handler built in phase 2.
 *
 * A server component; only the form itself is interactive. The two do not collide:
 * this is a page route and that is `/api/auth/register`.
 */
export default async function RegisterPage() {
  // Resolved rather than read off the session, for the same reason as `/sign-in`:
  // a cookie naming a deleted row must not bounce off this page.
  const user = await getCurrentUser();

  if (user) {
    redirect(DEFAULT_SIGNED_IN_PATH);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Start stashing snippets, prompts, and commands
        </p>
      </div>

      <RegisterForm />
    </div>
  );
}
