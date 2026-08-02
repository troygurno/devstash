import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard · DevStash",
};

/**
 * Placeholder for phase 1. Phase 3 fills this with the stats cards, recent
 * collections, pinned items, and recent items.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">Your developer knowledge hub</p>

      <h2 className="pt-8 text-lg font-semibold">Main</h2>
    </div>
  );
}
