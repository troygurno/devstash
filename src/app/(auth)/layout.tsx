import Link from "next/link";
import { Layers } from "lucide-react";

/**
 * The shell both auth pages share: brand mark over a centered card.
 *
 * A route group, so `(auth)` contributes nothing to the URL — the pages beneath it
 * are `/sign-in` and `/register`, which is what `context/project-overview.md` §7
 * lays out and what `proxy.ts` redirects to.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
          <Layers className="size-5" />
        </span>
        <span className="text-lg font-semibold">DevStash</span>
      </Link>

      <main className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        {children}
      </main>
    </div>
  );
}
