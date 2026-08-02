# Current Feature

**Dashboard UI — Phase 2 (sidebar)**

Replace the phase 1 sidebar placeholder with the real thing: item type navigation,
collections, a user area at the bottom, and collapse/expand behavior that degrades
to a drawer on mobile. The main area stays a placeholder until phase 3.

Spec: @context/features/dashboard-phase-2-spec.md

## Status

Built — awaiting browser sign-off

## Goals

- [x] Install the shadcn `sidebar` component and wrap the dashboard layout in
      `SidebarProvider`
- [x] Collapsible sidebar — collapses to icons only on desktop, toggled by a
      `SidebarTrigger` in the top bar (left of the search field, per the screenshot)
- [x] Always a drawer on mobile — off-canvas Sheet under `md`, opened by the same trigger
- [x] Brand row (logo + "DevStash") at the top of the sidebar
- [x] **Types** group — all 7 from `mockItemTypes`, each linking to `/items/[slug]`
      (e.g. `/items/snippets`), with a colored icon and its item count
- [x] **Collections › Favorites** — the starred collections, star instead of a count
- [x] **Collections › Recent** — the 5 most recently updated collections, with counts
- [x] Add `createdAt` / `updatedAt` to `MockCollection` + all six rows — Recent has
      nothing to sort on otherwise
- [x] Slug → Tailwind class map for type colors in `src/lib/item-types.ts`
- [x] Both group headers (`Types`, `Collections`) individually collapsible via chevron
- [x] User area pinned to the bottom — avatar with initials fallback, name, email,
      settings gear
- [x] Main area still a placeholder `h2`

## Decisions

Settled during spec review, where the spec, the screenshot, and
@context/project-overview.md disagreed:

| Question                            | Decision                                                                                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Second collections group            | **Recent**, per the spec — not the screenshot's `ALL COLLECTIONS`, which is really the non-favorites. Requires the new date fields.                          |
| Sidebar implementation              | shadcn `sidebar` — collapse, mobile Sheet, and persistence come with it, and the `--sidebar-*` tokens are already in `globals.css` unused.                   |
| Type colors vs. no-inline-styles    | Static slug → Tailwind class map. The hex in `mock-data.ts` stays as documentation; the class map is what renders. Reused for card borders in phase 3.       |
| Extra scope                         | Per-section chevrons **in**. Pro badges on Files/Images, the top bar's "New Collection" button, and stub `/items` routes are all **out**.                    |

## Notes

- Reference screenshot: @context/screenshots/dashboard-ui-main.png
- Tailwind v4 is CSS-first — theme tokens go in `@theme` inside `src/app/globals.css`.
  Never add a `tailwind.config.ts`.
- No database yet. @src/lib/mock-data.ts is the single source of truth for display data.
  `icon` is a lucide **name string**, so the sidebar needs an explicit name → component
  map. Alias `Image` and `Link` on import — they collide with `next/image` and `next/link`.
- **Assumption:** type order follows the `mockItemTypes` array (Links 5th), matching the
  type table in @context/project-overview.md. The screenshot puts Links last.
- **Assumption:** Recent includes favorites — a collection can appear in both groups.
- Every sidebar link 404s this phase: `/items/[typeSlug]`, `/collections/[id]`, and
  `/settings` are all unbuilt. Hrefs are correct per the route table in
  @context/project-overview.md; the pages come later.
- The `'use client'` boundary lives inside `src/components/ui/sidebar.tsx`, so
  @src/components/layout/AppSidebar.tsx and @src/components/layout/TopBar.tsx both stay
  server components even though the sidebar is interactive.
- **Phase 3** (next) — main area: recent collections, pinned items, 10 recent items,
  and 4 stats cards (items, collections, favorite items, favorite collections).

## History

<!-- Keep this updated. Earliest to latest -->

### 2026-08-02 — Initial Next.js setup

- Scaffolded with `create-next-app`: Next.js 16.2.12, React 19.2.4, TypeScript (strict), Tailwind CSS v4, App Router, Turbopack
- Removed the boilerplate SVGs from `public/` and stripped `src/app/page.tsx` to a placeholder heading
- Added the `context/` docs: `project-overview.md`, `coding-standards.md`, `ai-interaction.md`, `current-feature.md`
- Committed as `b68044c` (`chore: initial next.js and tailwind setup`) and pushed to `origin/main` at https://github.com/troygurno/devstash
- No dependencies beyond the scaffold yet — Prisma, Auth.js, and shadcn/ui still to come in Phase 1

### 2026-08-02 — Mock data source

- Added `src/lib/mock-data.ts` as the single source of truth for dashboard display data until the database lands
- Exports `mockUser`, `mockItemTypes` (all 7 system types), `mockCollections` (6), and `mockItems` (14 across every type)
- Field names mirror the Prisma models; `icon` is a lucide **name string** and dates are ISO strings so the file is safe to import from server components
- `itemCount` on types and collections is display-only and intentionally does not agree with the length of `mockItems`
- Committed as `f10c45b` (`feat: add mock data source for dashboard UI`) alongside `557bab8` (docs + screenshots), pushed to `origin/main`

### 2026-08-02 — Dashboard UI Phase 1 (shell & scaffolding)

- Branch `feature/dashboard-phase-1`
- Initialized shadcn/ui — the CLI has changed: `--base-color` no longer exists and it now asks for a preset, so init ran as `-b radix -p nova` (Radix components, Lucide icons, Geist). `components.json` records `style: "radix-nova"`
- Added components: `button`, `input`, `separator`. No `tailwind.config.ts` was created — Tailwind v4 CSS-first config held
- `shadcn init` rewrote `src/app/globals.css` with its theme tokens, replacing the scaffold's `:root` colors and `prefers-color-scheme` block
- Fixed a self-referential token the CLI emitted: `--font-sans: var(--font-sans)` now points at `--font-geist-sans`. Left unfixed the app silently falls back to a system font
- Dark mode by default via a hardcoded `dark` class on `<html>` plus `color-scheme: dark` in the `.dark` block. No theme toggle yet
- New route `/dashboard` with `layout.tsx` (sidebar + top bar + scrollable main) and `page.tsx`
- `src/components/layout/TopBar.tsx` — search field with a ⌘K hint and a "New Item" button, both display only
- `src/components/layout/Sidebar.tsx` — brand row plus the `Sidebar` placeholder; hidden under `md` pending the phase 2 mobile drawer
- All server components; nothing needed `'use client'`
- Verified: `npm run build` and `npm run lint` clean, and `/dashboard` renders correctly in the browser at 1440×900
- Known leftovers: `shadcn` was added to `dependencies` rather than `devDependencies`; `/` still renders the old placeholder `h1` and still conflicts with the route table in `project-overview.md`, which maps the dashboard to `/`

### 2026-08-02 — Dashboard UI Phase 2 (sidebar)

- Branch `feature/dashboard-phase-2`
- Spec review first — the spec, the screenshot, and `project-overview.md` disagreed in four places; see the Decisions table above for what was settled and why
- Added shadcn `sidebar`, `collapsible`, and `avatar`, which pulled in `sheet`, `tooltip`, `skeleton`, and `src/hooks/use-mobile.ts`. Still no `tailwind.config.ts`
- `src/components/layout/Sidebar.tsx` → `AppSidebar.tsx` — the phase 1 name collided with the shadcn `Sidebar` primitive it now imports
- `src/lib/item-types.ts` — lucide name → component map and slug → Tailwind class map. All seven hexes are exact palette matches (`#3b82f6` = `blue-500`, etc.), so nothing shifts visually by rendering classes instead of the hex
- `MockCollection` grew `createdAt` / `updatedAt`. Recent sorts on `updatedAt` desc, capped at 5 — Python Snippets is the one left out
- `SidebarTrigger` went into the top bar, left of the search field, with a vertical separator. `TooltipProvider` wraps the dashboard layout so collapsed-icon tooltips work; the newer shadcn `Tooltip` no longer self-provides
- The layout reads the `sidebar_state` cookie so a reload renders the collapsed state directly instead of flashing open. This makes `/dashboard` a dynamic route (`ƒ`) rather than static
- **Fixed a lint failure in vendored shadcn code:** `use-mobile.ts` ships with a `setState` inside an effect, which `react-hooks/set-state-in-effect` (new in eslint-config-next 16) rejects. Rewrote it on `useSyncExternalStore` with a `false` server snapshot. Re-running `shadcn add` for any sidebar-adjacent component will overwrite this
- Verified: `npm run lint`, `npm run build`, and `npx tsc --noEmit` all clean. Server-rendered HTML at `/dashboard` confirms type order, counts, both collection groups, the `JD` initials fallback, and the trigger
- **Not verified:** no browser automation was available this session, so collapse-to-icon, the mobile drawer, tooltips, and the chevron animations were not exercised visually
