import * as z from "zod";

/**
 * Zod schemas for the auth surface. `context/coding-standards.md` requires every
 * input to be validated with Zod; these are the first, so the shapes here set the
 * pattern for the item and collection routes that follow.
 */

/** Minimum password length. Length only — no character-class rules. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * bcrypt hashes at most 72 **bytes** and silently discards the rest — verified
 * against bcryptjs 3.0.3, where `compare("a".repeat(72) + "XXXX", hashOf72PlusTail)`
 * returns `true`. Left uncapped, a 100-character password from a manager would be
 * quietly reduced to its first 72 bytes. Rejecting is honest; truncating is not.
 *
 * The limit is in bytes, so this cannot be a plain `.max()` on length — a password
 * of emoji or accented characters passes 72 characters while exceeding 72 bytes.
 */
export const MAX_PASSWORD_BYTES = 72;

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/**
 * Registration. `email` lowercases before it reaches Postgres, whose `@unique` on
 * `User.email` is case-sensitive — without it `Demo@…` and `demo@…` are two rows.
 */
export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must be 100 characters or fewer"),
    email: z.email("Enter a valid email address").toLowerCase(),
    password: z
      .string()
      .min(
        MIN_PASSWORD_LENGTH,
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      )
      .refine(
        (value) => byteLength(value) <= MAX_PASSWORD_BYTES,
        `Password must be ${MAX_PASSWORD_BYTES} bytes or fewer`,
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Sign-in. Deliberately **does not** apply the registration password policy — an
 * account created before a policy change must still be able to authenticate, and
 * rejecting its password at the schema would lock the user out of their own row.
 * Only non-empty is required; bcrypt decides the rest.
 */
export const credentialsSchema = z.object({
  email: z.email("Enter a valid email address").toLowerCase(),
  password: z.string().min(1, "Enter your password"),
});
