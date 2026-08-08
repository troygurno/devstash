import { AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * A single field's validation message.
 *
 * Only the first message is shown. Zod returns every failure for a field — a short
 * password that is also over the byte cap produces two — and stacking them under one
 * input reads as noise. Fixing the first surfaces the next on the following submit.
 *
 * The `id` is what the input points at with `aria-describedby`, so a screen reader
 * announces the message when focus lands on the field rather than only on submit.
 */
export function FieldError({
  id,
  messages,
}: {
  id: string;
  messages?: string[];
}) {
  if (!messages?.length) return null;

  return (
    <p id={id} className="text-sm text-destructive">
      {messages[0]}
    </p>
  );
}

/**
 * A form-level message — the ones that belong to no single field, like a rejected
 * sign-in or a failed request.
 *
 * The role follows the variant rather than being fixed. An error appears in response
 * to something the user just did and should interrupt, so `alert` (assertive). The
 * success notice is server-rendered on arrival and is not urgent, so `status`
 * (polite) — `alert` would talk over whatever the screen reader was already saying
 * about the page it just loaded.
 *
 * Renders nothing at all when there is no message, which keeps an empty live region
 * out of the tree.
 */
export function FormAlert({
  message,
  variant = "error",
}: {
  message: string | null;
  variant?: "error" | "success";
}) {
  if (!message) return null;

  const isError = variant === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          : "flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-500"
      }
    >
      {isError ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <span>{message}</span>
    </div>
  );
}
