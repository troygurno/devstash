"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import * as z from "zod";

import { FieldError, FormAlert } from "@/components/auth/FormFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SIGN_IN_PATH } from "@/lib/auth-routes";
import { MIN_PASSWORD_LENGTH, registerSchema } from "@/lib/validations/auth";

type RegisterField = "name" | "email" | "password" | "confirmPassword";
type FieldErrors = Partial<Record<RegisterField, string[]>>;

/** What `/api/auth/register` returns on a 400 or a 409. */
interface RegisterErrorBody {
  error?: string;
  fieldErrors?: FieldErrors;
}

/**
 * Account creation against `POST /api/auth/register`.
 *
 * Validates with the same `registerSchema` the route handler uses, so the 8
 * character minimum, the 72-**byte** bcrypt cap, and the passwords-match rule are
 * stated once. The client pass is a courtesy that saves a round trip; the route
 * revalidates every field regardless, because nothing stops a request arriving
 * without this form.
 *
 * On success it redirects to sign-in rather than signing the user in, per the spec.
 */
export function RegisterForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);

    const form = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      confirmPassword: form.get("confirmPassword"),
    });

    if (!parsed.success) {
      setFieldErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }

    setPending(true);

    let response: Response;
    try {
      response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
    } catch {
      setFormError("Could not reach the server. Check your connection.");
      setPending(false);
      return;
    }

    if (response.ok) {
      // Stay pending through the navigation so the button cannot be pressed twice.
      router.push(`${SIGN_IN_PATH}?registered=1`);
      router.refresh();
      return;
    }

    const body: RegisterErrorBody = await response.json().catch(() => ({}));

    // 409 is the duplicate-email case, which the route reports as a form-level
    // message rather than a field one. It belongs on the email input.
    if (response.status === 409) {
      setFieldErrors({
        email: [body.error ?? "An account with that email already exists"],
      });
    } else if (body.fieldErrors) {
      setFieldErrors(body.fieldErrors);
    } else {
      setFormError(body.error ?? "Could not create the account.");
    }

    setPending(false);
  }

  return (
    <div className="space-y-6">
      <FormAlert message={formError} />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
          />
          <FieldError id="name-error" messages={fieldErrors.name} />
        </div>

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
            autoComplete="new-password"
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={
              fieldErrors.password ? "password-error" : "password-hint"
            }
          />
          {fieldErrors.password ? (
            <FieldError id="password-error" messages={fieldErrors.password} />
          ) : (
            <p id="password-hint" className="text-xs text-muted-foreground">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            disabled={pending}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={
              fieldErrors.confirmPassword ? "confirm-error" : undefined
            }
          />
          <FieldError
            id="confirm-error"
            messages={fieldErrors.confirmPassword}
          />
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : null}
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={SIGN_IN_PATH}
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
