/**
 * Fixed locale on purpose. `toLocaleDateString()` with no locale uses the runtime's
 * default, which differs between the server and the browser and shows up as a
 * hydration mismatch.
 */
const SHORT_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/** "2026-01-15T10:00:00.000Z" → "Jan 15". Takes a Date as it comes off Prisma. */
export function formatShortDate(date: Date | string): string {
  return SHORT_DATE.format(typeof date === "string" ? new Date(date) : date);
}
