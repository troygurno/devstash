import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Display only for phase 1 — the search field is inert and "New Item" opens
 * nothing. Wiring comes with the command palette and item drawer.
 */
export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
      <div className="relative w-full max-w-md">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder="Search items…"
          aria-label="Search items"
          className="h-9 pr-16 pl-8"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 items-center gap-1 rounded border border-border px-1.5 py-0.5 font-mono text-[0.7rem] text-muted-foreground sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <Button size="lg" className="ml-auto">
        <Plus aria-hidden="true" />
        New Item
      </Button>
    </header>
  );
}
