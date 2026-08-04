# Current Feature

**Dashboard collections — real data from Postgres**

Move the Collections section of the dashboard main area off @src/lib/mock-data.ts and
onto the seeded Neon database via Prisma. The grid should look exactly as it does
now — same cards, same layout — but the names, descriptions, item counts, favorite
stars, accent border, and type icons all come from real rows.

Items stay on mock data this round; the Pinned and Recent sections are explicitly out
of scope.

Spec: @context/features/dashboard-collections-spec.md

## Status

Complete — built and verified. Still on `feature/dashboard-collections`; not yet
committed or merged.

## Goals

- [x] `src/lib/db/collections.ts` — `getRecentCollections` and `getCollectionStats`,
      the only place the dashboard's collection queries live
- [x] Fetch directly in the server component (@src/app/dashboard/page.tsx); no route
      handler, no Server Action — this is a read
- [x] Per-collection item count, computed in the query rather than by loading items
- [x] Dominant type per collection → the card's left border color, from a grouped
      count in the query (see the collection card color rule in
      @context/project-overview.md §11)
- [x] Distinct type icons per collection, rendered as the small icon row on the card
- [x] Rework `CollectionCard` to take `DashboardCollection` instead of
      `MockCollection`, resolving types from the query result rather than
      `mockItemTypesById`
- [x] Update the collections figures in `StatsCards`
- [x] Filter `deletedAt: null`; sort by `updatedAt` desc; cap at the existing
      `COLLECTION_LIMIT` of 6
- [x] Empty state — the seed has collections, but the query must not assume it
- [x] Verify: `npm run lint`, `npm run build`, `npx tsc --noEmit` clean, and the
      served HTML checked card by card

## Open Questions

| #   | Question                                                       | Resolution                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Which user's collections, with no auth yet?                    | **Demo user by email**, behind `getCurrentUserId()` in a new @src/lib/db/user.ts. One function to replace when Auth.js lands, rather than a `where: { userId }` sweep. Returns null on an unseeded database and the page renders empty. |
| 2   | "Update collection stats display" — how far does that reach?   | **Collections and Favorite Collections only.** Items are out of scope by the spec's own line, so Items / Favorite Items stay on mock data. `StatsCards` now takes a `collections` prop and keeps the two item figures internal.        |
| 3   | Dominant type: one grouped query, or one query per collection? | **One `$queryRaw` grouped by `(collectionId, itemTypeId)`.** Prisma's `groupBy` can't reach `Item.itemTypeId` through `ItemCollection`, and the alternative — loading membership rows and tallying in JS — is what §11 warns against.  |
| 4   | Ties on dominant type?                                         | **`defaultTypeId` first, then lowest `sortOrder`.** The seed *does* set `defaultTypeId` on all five collections, so the documented tiebreak is live; `sortOrder` is the second tier so the border can't flip between requests.         |
| 5   | Does the icon row cap?                                         | **No cap.** Seeded collections top out at 3 distinct types and seven 16px icons still fit the card. Revisit if a collection ever spans all seven.                                                                                     |

## Notes

- The grid renders **5** cards, not 6 — that's the seed's collection count, and
  `COLLECTION_LIMIT = 6` is no longer the binding constraint.
- Dominant types came out as expected: React Patterns blue, AI Workflows violet,
  Terminal Commands orange, Design Resources emerald, and DevOps emerald — DevOps
  holds 2 links against 1 snippet and 1 command, so links wins outright even though
  its `defaultTypeId` is Snippet. Icon rows are ordered most-used first.
- `COUNT(*)` is `int8`, which the Neon driver hands back as a **string**. The
  `::int` cast in the raw query is what makes `count` a number on the JS side —
  without it the sort and the sum both silently misbehave.
- `= ANY(${ids}::text[])` is the parameterized form that works through the Neon
  serverless driver; the explicit cast is needed because Postgres can't infer the
  element type of a bare parameter.
- Sort order is real but not meaningful yet: the seed writes all five collections
  within ~250ms, so `updatedAt` desc is effectively reverse insertion order, and
  the grid leads with Design Resources.
- **First real import of @src/lib/prisma.ts.** Next bundled the client and the Neon
  adapter without complaint — no config change, no `serverExternalPackages` entry.
- `/dashboard` was already dynamic (`ƒ`) from the `sidebar_state` cookie read, so
  querying didn't change its render mode.
- Three sequential round trips to Neon (user → collections → counts+types), landing
  around 800ms of application time on a warm dev server. Fine for now; the user
  lookup collapses into the session once auth exists.
- @src/lib/mock-data.ts stays, with no exports left orphaned: Pinned/Recent and
  `ItemRow` still use `mockItems` and `mockItemTypesById`, `StatsCards` still uses
  `mockItemTypes`, and @src/components/layout/AppSidebar.tsx still uses
  `mockCollections`.
- **The sidebar and the main area now disagree.** The spec scoped this to the
  right-hand grid, so the sidebar's Favorites and Recent lists still render the six
  mock collections — different names, different count — beside five real cards. It
  looks wrong on screen and is worth its own follow-up.
- The prod Neon branch still has **no migrations applied** and no seed.

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
- Merged to `main` as `593050f` and pushed. The duplicate `dashboard-ui-my*.png` screenshots went out as a separate `chore:` commit (`9214822`)

### 2026-08-03 — Dashboard UI Phase 3 (main area)

- Branch `feature/dashboard-phase-3`
- Added shadcn `card` and `badge`. Still no `tailwind.config.ts`
- `src/components/dashboard/StatsCards.tsx`, `src/components/collections/CollectionCard.tsx`, `src/components/items/ItemRow.tsx`; `src/app/dashboard/page.tsx` composes them
- `item-types.ts` grew `getItemTypeBorderClass` and `getItemTypeBgClass` alongside the phase 2 text-color map
- `src/lib/format.ts` — `formatShortDate` pinned to `en-US`. A bare `toLocaleDateString()` picks up the runtime default, which differs between server and browser and hydrate-mismatches
- `mockItemTypesById` added to `mock-data.ts` for resolving `itemTypeId` / `dominantTypeId`
- Item rows show **`createdAt`**, not `updatedAt` — the screenshot's "API Error Handling Pattern" reads Jan 12, its creation date, against a Jan 20 update
- **Second lint fix in as many phases:** `react-hooks/static-components` rejects `const Icon = getItemTypeIcon(...)` in a component body, though the identical lookup inside a `.map()` callback in `AppSidebar` and `CollectionCard` passes. `ItemRow` returns the element from a plain `renderTypeIcon()` function instead
- Verified: `npm run lint`, `npm run build`, `npx tsc --noEmit` clean. Served HTML confirms the four stat values (85 / 6 / 3 / 3), six collection cards in `updatedAt` order, 14 item rows split 4 pinned + 10 recent with no overlap, and all seven type tints
- **Not verified by me:** no browser automation this session, so hover states, the responsive breakpoints, and the overall visual match against the screenshot went unchecked on my side. Signed off by Troy on 2026-08-03, closing phases 2 and 3
- Merged to `main` as `40f0911` and pushed. Completes the three-phase dashboard UI

### 2026-08-03 — Database: Neon Postgres + Prisma 7

- Branch `feature/database-prisma-neon`
- Installed `prisma` 7.9.1, `@prisma/client`, `@prisma/adapter-neon`, `@neondatabase/serverless`, plus `dotenv` and `tsx` for the config and seed
- `"type": "module"` added to `package.json`. Low risk here — the only root configs are `next.config.ts`, `postcss.config.mjs`, and `eslint.config.mjs`, none of them extensionless `.js`. `tsconfig.json` already had `module: esnext` / `moduleResolution: bundler`, so it needed no change
- **`datasource.url` is rejected in Prisma 7** (`P1012`) — not just deprecated. The schema block in `project-overview.md` §6 still has it and will fail if copied. Connection string reaches Migrate via `prisma.config.ts` and the client via the adapter
- Prisma's CLI runs outside Next, so nothing loads `.env` for it — `prisma.config.ts` imports `dotenv/config` explicitly
- Schema per `project-overview.md` §6, plus the two approved additions: `deletedAt` on `Item`/`Collection`, and `isPublic` + unique `publicSlug` on both. List indexes lead with `deletedAt` since every list query filters it before sorting
- Two migrations: `20260803185015_init` and `20260803185100_system_type_slug_unique`. The second is hand-written — Prisma can't express a partial unique index, and `@@unique([userId, slug])` does not stop duplicate system types because Postgres treats `NULL` as distinct
- `prisma/seed.ts` upserts the 7 system types on fixed IDs (`sys-type-snippet`, …) so re-running is safe and the same row keeps the same id across environments
- npm scripts added: `db:generate`, `db:migrate`, `db:deploy`, `db:status`, `db:seed`, `db:studio`, `db:test`
- `scripts/test-db.ts` — 15-check smoke test covering connection, seed state, the partial index, a CRUD round-trip, soft delete, and cascade deletes. Writes against `DATABASE_URL`, so it belongs on the dev branch; everything hangs off one throwaway user deleted at both ends of the run
- Verified: `migrate status` in sync, seed run twice leaves exactly 7 rows, all seven slugs/contentTypes correct with `userId` null, and a duplicate system slug is **rejected** by the partial index. `npm run lint`, `npm run build`, `npx tsc --noEmit` all clean
- **Not verified:** nothing imports `src/lib/prisma.ts` yet, so Next has never bundled the client or the Neon driver. That gets exercised when the dashboard moves off `mock-data.ts`
- Merged to `main` as `b166480` and pushed. Carried forward at rollover: the prod Neon branch still has no migrations applied and no seed

### 2026-08-03 — Seed data (demo user, collections, items)

- Branch `feature/seed-data`
- Installed `bcryptjs` 3.x. Skipped `@types/bcryptjs` — v3 ships its own types and the DefinitelyTyped package (still on 2.x) conflicts with them
- Rewrote `prisma/seed.ts`: 7 system types (unchanged), 1 demo user, 25 tags, 5 collections, 18 items. Everything upserts on a fixed id
- **Spec vs. schema conflict:** the seed spec's type table omits `slug` and `contentType`, both required by the schema and relied on by the sidebar, and it orders/cases the types differently from `project-overview.md` §4. Kept the existing seed's values; the spec's icons and colors matched exactly, so nothing visual changed
- The spec specifies no tags, pins, favorites, or `lastUsedAt`. Filled those in on the items it *does* specify, since Pinned and Recent are the entire dashboard main area, but did **not** add note/file/image items — that would be inventing content. Notes, Files, Images stay at 0
- `lastUsedAt` uses fixed ISO timestamps rather than offsets from `now()`, so re-running doesn't reshuffle Recent. `emailVerified` is the one non-deterministic column, per spec
- Item tags use `set` on update rather than `connect`, so editing the seed file and re-running drops removed tags instead of accumulating them
- `scripts/test-db.ts` grew a "Demo working set" section: password verifies via bcrypt `compare`, hash is 12 rounds, counts match, every item has a collection and a tag, `content`/`url` agree with the type's `contentType`, link URLs are real `https://`, and nothing is soft-deleted
- The same script now **prints** the demo data before asserting on it — a per-type histogram, every collection with its items (type, title, tags, `lastUsedAt`, content size, `P`/`*` markers for pinned and favorite), the five most recently used, and the pinned list. Reading the seed is now a `npm run db:test` away rather than a Studio session
- 31 checks total
- Verified: seeded twice, counts identical both times (1 user / 7 types / 5 collections / 18 items / 25 tags / 18 memberships). Type spread is 4 snippets, 3 prompts, 5 commands, 6 links. All 27 smoke-test checks pass. `npm run lint`, `npm run build`, `npx tsc --noEmit` clean
- The demo password is a dev credential. Seeding is manual, so keeping it off the prod branch is discipline, not automation

### 2026-08-04 — Dashboard collections from Postgres

- Branch `feature/dashboard-collections`
- `src/lib/db/collections.ts` — `getRecentCollections(userId, limit)` returns `DashboardCollection[]`, and `getCollectionStats(userId)` returns the totals for the stat cards. `itemCount`, `dominantType`, and `types` are derived, so they live on the query result type rather than on the Prisma model
- `src/lib/db/user.ts` — `getCurrentUserId()` resolves the seeded demo account by email. Auth.js isn't built, so there's no session; this is the one function to replace later instead of a `where: { userId }` sweep. Returns null on an unseeded database and the page renders its empty state
- **Prisma's `groupBy` can't do this query.** The count needs `(collectionId, itemTypeId)` and `itemTypeId` lives on `Item`, one hop past `ItemCollection`. `$queryRaw` grouped in Postgres instead — the alternative, loading membership rows and tallying in JS, is exactly what the card color rule in `project-overview.md` §11 warns against
- **`COUNT(*)` is `int8`, which the Neon driver returns as a string.** The `::int` cast in the raw query is load-bearing; without it `count` sorts and sums as text. Same class of problem with `= ANY(${ids}::text[])` — Postgres can't infer a bare parameter's element type through the serverless driver
- Dominant type: highest count, ties to `defaultTypeId`, then lowest `sortOrder` so the border can't flip between requests. Empty collections get no dominant type and fall back to the neutral border. The seed sets `defaultTypeId` on all five collections, so the documented tiebreak is live — though it never actually fires on this data
- `CollectionCard` swapped `MockCollection` for `DashboardCollection` and now resolves types from the query result rather than `mockItemTypesById`. `description` is nullable on the real model, so the paragraph renders conditionally
- `StatsCards` became a props-taking component. Only Collections and Favorite Collections are real; Items and Favorite Items stay on mock data because the spec put items out of scope
- **First real import of `src/lib/prisma.ts`.** Next bundled the client and the Neon adapter with no config change and no `serverExternalPackages` entry — the gap carried since the database feature is closed
- Three sequential round trips to Neon (user → collections → counts + types), about 800ms of application time on a warm dev server. The user lookup collapses into the session once auth exists
- Verified: `npm run lint`, `npm run build`, `npx tsc --noEmit` clean. Served HTML checked card by card — 5 cards in `updatedAt` desc order, stats reading 85 / 5 / 3 / 3, and every border and icon row correct (Design Resources emerald/4, Terminal Commands orange/4, DevOps emerald/4 with three icons, AI Workflows violet/3, React Patterns blue/3)
- **Not verified by me:** no browser automation this session, so hover states, responsive breakpoints, and the match against `context/screenshots/dashboard-ui-main.png` went unchecked
- **Known inconsistency, deliberately left:** the sidebar's Favorites and Recent lists still render the six mock collections next to five real cards. The spec scoped this to the main area; the sidebar is its own follow-up
- Left in place: `mock-data.ts` keeps every export in use — `mockItems` and `mockItemTypesById` for Pinned/Recent and `ItemRow`, `mockItemTypes` for the item stats, `mockCollections` for the sidebar
- Carried forward: the prod Neon branch still has no migrations applied and no seed
