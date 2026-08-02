# Current Feature

**Dashboard UI — Phase 1 (shell & scaffolding)**

Stand up the shadcn/ui foundation, the `/dashboard` route, and the app shell with a
top bar. Sidebar and main area are placeholders this phase — they get filled in by
phases 2 and 3.

Spec: @context/features/dashboard-phase-1-spec.md

## Status

Completed

## Goals

- [x] Initialize shadcn/ui (theme tokens, `components.json`, `cn` util)
- [x] Install the shadcn components this phase needs
- [x] Dashboard route at `/dashboard`
- [x] Main dashboard layout + any global styles
- [x] Dark mode by default
- [x] Top bar: search field and "New Item" button — **display only**, no behavior
- [x] Sidebar and main area as placeholders — just an `h2` reading "Sidebar" and "Main"

## Notes

- Reference screenshot: @context/screenshots/dashboard-ui-main.png. The file in
  `context/screenshots/` is actually named `dashboard-ui-mymain.png`; the correctly
  named copy is at @context/dashboard-ui-main.png. Worth reconciling.
- Tailwind v4 is CSS-first — theme tokens go in `@theme` inside `src/app/globals.css`.
  Do **not** let `shadcn init` create a `tailwind.config.ts`.
- No database yet. @src/lib/mock-data.ts is the single source of truth for display
  data, though phase 1 renders placeholders and may not need it until phase 2.
- Scope boundaries for the phases that follow:
  - **Phase 2** — collapsible sidebar, type links to `/items/[type]`, favorite and
    recent collections, user avatar area, mobile drawer.
  - **Phase 3** — main area: recent collections, pinned items, 10 recent items, and
    4 stats cards (items, collections, favorite items, favorite collections).

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
