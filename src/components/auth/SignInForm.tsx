"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import * as z from "zod";

import { FieldError, FormAlert } from "@/components/auth/FormFeedback";
import { GitHubIcon } from "@/components/auth/GitHubIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessage } from "@/lib/auth-errors";
import { REGISTER_PATH } from "@/lib/auth-routes";
import { credentialsSchema } from "@/lib/validations/auth";

type FieldErrors = Partial<Record<"email" | "password", string[]>>;

interface SignInFormProps {
  /** Already reduced to an internal path by the page. */
  callbackUrl: string;
  /** From `?error=`, when a provider handoff failed before reaching this form. */
  initialError: string | null;
  /** Set after registering, so the new account knows why it landed here. */
  notice: string | null;
}

/**
 * Email/password and GitHub sign-in.
 *
 * A client component because the spec asks for inline error display: credentials
 * sign in with `redirect: false` so a rejection can be rendered in place rather than
 * bouncing through `?error=` and losing what the user typed.
 *
 * Validation runs against `credentialsSchema`, which deliberately carries no
 * password policy — see the note on it. Applying the registration rules here would
 * reject the password of an account created under an older policy before the request
 * ever reached bcrypt.
 */
export function SignInForm({
  callbackUrl,
  initialError,
  notice,
}: SignInFormProps) {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(initialError);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const form = new FormData(event.currentTarget);
    const parsed = credentialsSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });

    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    setPending(true);

    const result = await signIn("credentials", {
      ...parsed.data,
      redirect: false,
    });

    if (!result || result.error) {
      // Always `CredentialsSignin`, whatever actually went wrong. `authorize`
      // refuses to distinguish a bad password from an unknown account.
      setFormError(authErrorMessage(result?.error ?? "CredentialsSignin"));
      setPending(false);
      return;
    }

    // `redirect: false` means Auth.js did not navigate, so this does. `refresh`
    // discards the router cache — without it the dashboard can render from an entry
    // fetched while nobody was signed in.
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <FormAlert message={notice} variant="success" />
      <FormAlert message={formError} />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
          <FieldError id="email-error" messages={fieldErrors.email} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "password-error" : undefined
            }
          />
          <FieldError id="password-error" messages={fieldErrors.password} />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : null}
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/*
        GitHub redirects away, so there is no `redirect: false` here and no result to
        inspect — a failure comes back as `?error=` on this page, which `initialError`
        renders. `redirectTo` is validated same-origin by Auth.js, and the page has
        already reduced it to an internal path regardless.
      */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={() => {
          setPending(true);
          setFormError(null);
          // The happy path navigates away and this promise never settles. If it
          // rejects instead — the request never reaches Auth.js — the form has to be
          // handed back, or it sits disabled with nothing said and no way to retry.
          signIn("github", { redirectTo: callbackUrl }).catch(() => {
            setFormError(authErrorMessage("OAuthSignin"));
            setPending(false);
          });
        }}
      >
        <GitHubIcon className="size-4" />
        Sign in with GitHub
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={REGISTER_PATH}
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
