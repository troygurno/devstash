import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import * as z from "zod";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

/**
 * Matches `BCRYPT_ROUNDS` in `prisma/seed.ts` so the demo account and a registered
 * account are hashed to the same cost.
 */
const BCRYPT_ROUNDS = 12;

/**
 * Prisma's unique-constraint violation. Duck-typed rather than imported, to keep
 * the generated `Prisma` namespace out of a file that otherwise needs only the
 * client — the same call `src/lib/db/items.ts` makes about `Prisma.ItemSelect`.
 */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

/**
 * `POST /api/auth/register` — create an email/password account.
 *
 * A route handler rather than a Server Action because it returns real HTTP status
 * codes (201/400/409), which `context/coding-standards.md` names as one of the
 * reasons to reach for a route at all.
 *
 * This resolves ahead of the `[...nextauth]` catch-all beside it: Next matches
 * static segments before dynamic ones.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    // An existing GitHub account owns its email too, so this rejects rather than
    // attaching a password to it. Letting an unauthenticated request set the hash
    // on an account it does not own is an account-takeover path, not a
    // convenience; adding a password to an OAuth account belongs behind a session
    // in settings.
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: { name, email, passwordHash: await hash(password, BCRYPT_ROUNDS) },
      // Explicit select — a bare `create` returns the row including `passwordHash`.
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    // The check above is not atomic; `User.email` being `@unique` is the actual
    // guarantee. Two simultaneous registrations for one email land here.
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }

    console.error("[api/auth/register]", error);
    return NextResponse.json(
      { error: "Could not create the account" },
      { status: 500 },
    );
  }
}
