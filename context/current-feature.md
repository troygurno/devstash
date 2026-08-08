# Current Feature

<!-- Load a spec with /feature load [name] -->

## Status

Not Started

## Goals

<!-- Populated by /feature load -->

## Notes

<!-- Populated by /feature load -->

## Open Questions

<!-- Populated by /feature load -->

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
- The spec specifies no tags, pins, favorites, or `lastUsedAt`. Filled those in on the items it _does_ specify, since Pinned and Recent are the entire dashboard main area, but did **not** add note/file/image items — that would be inventing content. Notes, Files, Images stay at 0
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
- Merged to `main` as `e798cac` (feature commit `2cc7c84`) and pushed
- Carried forward: the prod Neon branch still has no migrations applied and no seed

### 2026-08-04 — Dashboard items from Postgres

- Branch `feature/dashboard-items`
- `src/lib/db/items.ts` — `getPinnedItems(userId)`, `getRecentItems(userId, limit)`, and `getItemStats(userId)`. `DashboardItem` is the flattened shape `ItemRow` consumes: the joined `itemType` becomes `type`, and the tag relation collapses to a `string[]`
- **No raw SQL this round.** `findMany` with a nested `select` on `itemType` and `tags` resolves both relations in one round trip, so the `::int` and `ANY(...::text[])` casts that `collections.ts` needs never came up. The collections work needed `$queryRaw` only because it grouped a count two hops out; a per-row join doesn't
- One shared `DASHBOARD_ITEM_SELECT` for both list queries so Pinned and Recent can't drift apart, with an `ItemRowResult` interface describing what it returns. Typing it off the generated `Prisma.ItemSelect` would be tighter but drags the namespace import into a file that otherwise only needs the client
- Recent orders by `lastUsedAt` desc **nulls last**, then `createdAt` desc. A never-used item sorts in at the bottom rather than dropping out — hiding it would leave Recent looking empty on a stash that isn't. The seed sets `lastUsedAt` on all 18 items, so nulls-last isn't exercised by this data
- Recent excludes Pinned with `isPinned: false` rather than by id. Pinned is uncapped, so it always renders every pinned row and the flag filter is exact; it also keeps the queries independent enough to run in parallel. Revisit if Pinned ever gets a limit
- Tags ordered alphabetically **in the query**, not in the component, so a row can't reshuffle its chips between requests
- `ItemRow` swapped `MockItem` for `DashboardItem`; `description` is nullable on the real model so the paragraph renders conditionally, matching what `CollectionCard` already does
- `StatsCards` lost its `mock-data` import entirely — all four figures are real counts now. **Items reads 18**, down from mock data's invented 85
- `formatShortDate` widened to `Date | string`. Prisma returns `Date`, and `<time dateTime>` needs an explicit `.toISOString()` — a bare `Date` renders as "Mon Aug 03 2026 …" in the attribute
- Pinned hides its heading along with its rows when empty, per the spec. Recent gets a dashed empty state matching the Collections one
- Five queries per load now (user, then collections + collection stats + pinned + recent + item stats in one `Promise.all`). Application time roughly unchanged from the collections round because the four new ones overlap
- **The date column went flat and it's a seed gap, not a query bug:** `prisma/seed.ts` never sets `Item.createdAt`, so all 18 rows default to `now()` at seed time and every row reads the same "Aug 3" where mock data spanned Jan–Jul. Shipped as-is; recorded as an open follow-up with three options (leave it, switch the column to `lastUsedAt`, or seed `createdAt`)
- Verified: `npm run lint`, `npm run build`, `npx tsc --noEmit` clean. Served HTML checked row by row — stats 18 / 5 / 6 / 3; Pinned renders 3 rows in `lastUsedAt` desc order with pin markers; Recent renders 10 of the 15 unpinned rows with no overlap and the five least-recently-used correctly cut; all 13 descriptions present; borders and icon tiles correct per type; tags alphabetical on every row
- **Not verified:** both empty states are code-read only — exercising them needs an empty database or a soft-delete sweep. No browser automation this session, so hover states and responsive breakpoints went unchecked, same as the previous two rounds
- Left orphaned rather than deleted: `mockItems`, `mockItemTypesById`, and the `MockItem` type in `src/lib/mock-data.ts`. Nothing imports them now; the sidebar follow-up is the natural time to clear the file out. `mockCollections`, `mockItemTypes`, and `mockUser` are still live in `AppSidebar`
- **Known inconsistency, now wider:** the sidebar's per-type item counts total 85 against a real 18 on the stat card, and it still lists six mock collections beside five real ones
- The seed holds 18 items across 4 types, so notes, files, and images render nowhere — four of the seven type tints are unexercised on screen
- Merged to `main` as `7ad97c4` (feature commit `149f290`) and pushed; branch deleted
- Carried forward: the prod Neon branch still has no migrations applied and no seed

### 2026-08-04 — Stats & sidebar from Postgres

- Branch `feature/stats-sidebar`
- **The spec was two-thirds already built.** Its "display stats from database data"
  bullet closed last round when `StatsCards` came off mock data, and its "create
  `src/lib/db/items.ts`" bullet described a file that already existed. What remained
  was the sidebar, which was the last thing in the app still reading `mock-data.ts`
- `getItemTypeCounts(userId)` added to `src/lib/db/items.ts` — a Prisma **`groupBy`**,
  no raw SQL. `itemTypeId` is a column on `Item`, so the count is one hop; the
  `$queryRaw` in `collections.ts` exists only because _its_ count keys on
  `(collectionId, itemTypeId)` two hops out. A type holding nothing doesn't come back
  from a group at all, so the seven types are fetched separately and the counts merge
  onto them rather than the other way round
- The type query scopes to `userId: null OR userId` — system types plus the user's
  own. Custom types are a later Pro feature, so today it always returns the seven
  seeded rows, but the query is already correct when they land
- `getSidebarCollections(userId, recentLimit)` added to `src/lib/db/collections.ts`,
  returning `{ favorites, recent }`. Favorites sort **alphabetically** — a
  hand-curated list shouldn't reorder itself whenever an item is added, which is what
  the Recent list beneath it is for
- **Extracted `rankTypesByCollection` and `pickDominantType`** out of
  `getRecentCollections` so the sidebar shares the derivation instead of duplicating
  the raw SQL. `getRecentCollections` behaves identically — same ordering, same
  `defaultTypeId` tiebreak, same neutral fallback — it just reads ranked rows from the
  helper now. The sidebar's two lists are unioned before the breakdown runs, keeping
  it to one grouped query rather than one per list
- `AppSidebar` became an **async server component** fetching its own data. It renders
  from the layout, not the page, so threading props through would have bought nothing.
  Cost: it queries on every dashboard route, which matters once `/items` and
  `/collections` exist
- `getItemTypeDotClass` added to `item-types.ts` as its own map. `getItemTypeBgClass`
  returns `bg-*/10`, a tile tint that disappears at 8px; the dot needs the solid
  `bg-blue-500` form, falling back to `bg-muted-foreground/40` for a collection with
  no dominant type
- **`ItemType.name` is singular in the seed** ("Snippet") where the sidebar showed
  plural. Added a slug → plural label map beside the four maps already keyed that way,
  falling back to the stored name so a custom type renders as named
- Recent rows traded the count badge for the dot — the badge slot holds one thing.
  Favorites show a star and no number, Recent a dot and no number, so **the sidebar no
  longer states a collection's size anywhere**. The main-area cards still do
- `getCurrentUser()` added beside `getCurrentUserId` in `src/lib/db/user.ts`; the
  footer reads Demo User / demo@devstash.io instead of John Doe. Outside the spec's
  bullets, but `mock-data.ts` couldn't be deleted while the footer imported it — the
  one call made without an explicit answer from Troy
- **`src/lib/mock-data.ts` deleted.** Nothing in `src/` imports it; the stale
  references left in `item-types.ts` and `StatsCards.tsx` comments were cleaned up
  with it. The app is now entirely on Postgres
- Seven queries per dashboard load: the sidebar's three (user, then type counts and
  collections) plus the page's five, overlapping inside two `Promise.all`s. The
  sidebar's collection query is deliberately separate from the page's — different
  shape, different limit
- **Both carried inconsistencies are closed.** Per-type counts total **18** against
  the Items stat card's 18, where they read 85 before, and the sidebar lists the same
  five collections the main area renders instead of six invented ones
- Notes, Files, and Images now read a real **0** where mock data invented 12 / 5 / 3 —
  the first honest showing of the seed's shape, and the first live outing for the
  yellow Note color, on a badge, which is the use `project-overview.md` §4 says it's
  safe for
- Verified: `npm run lint`, `npm run build`, `npx tsc --noEmit` clean. Served HTML
  checked entry by entry — Types read 4 / 3 / 5 / 0 / 6 / 0 / 0 with all seven hrefs
  resolving to `/items/<slug>`; Favorites are AI Workflows, React Patterns, Terminal
  Commands with amber stars; Recent is Design Resources, Terminal Commands, DevOps, AI
  Workflows, React Patterns in `updatedAt` desc with dots emerald / orange / emerald /
  violet / blue, matching the dominant types the cards resolved last round; footer
  reads `DU` / Demo User / demo@devstash.io; stat cards unchanged at 18 / 5 / 6 / 3
- A dev server was already running on :3000 for this directory, so Next refused a
  second instance and verification ran against that one — it picked the changes up via
  HMR with no restart
- **Not verified:** the three empty states (no favorites, no collections, no user) are
  code-read only — exercising them needs an empty database. No browser automation this
  session, so the dot's weight against the star, collapse-to-icon on the new "View all
  collections" row, and hover states went unchecked, same as every round since phase 2
- Merged to `main` as `4398273` (feature commit `56d214c`) and pushed; branch deleted
- Carried forward: the flat "Aug 3" item date from the unseeded `Item.createdAt`, and
  the prod Neon branch with no migrations applied and no seed

### 2026-08-06 — PRO badge on the sidebar's Pro-gated types

- Branch `feature/add-pro-badge-sidebar`
- Smallest round yet: two source files, +33/−1, no query, schema, route, or
  dependency changes. `shadcn/ui` `Badge` has been installed since dashboard phase 3,
  so no `shadcn add` either
- `PRO_ITEM_TYPE_SLUGS` and `isProItemType(slug)` added to `src/lib/item-types.ts`,
  beside the five maps already keyed by slug. **`ItemType` has no `isPro` column** and
  this didn't warrant a migration — a type's tier is presentation until the Phase 4
  gates in `limits.ts` land, and those enforce server-side regardless of what the
  sidebar renders. `project-overview.md` §4 is the source naming files and images as
  the Pro pair
- **PRO replaces the count** on those two rows rather than sitting beside it — Troy's
  call at `start`. `SidebarMenuBadge` is one absolutely-positioned slot, so it holds
  one thing, the same reasoning that had Recent collections trade their count for a
  dominant-type dot last round. Both rows read 0 today so nothing is lost yet; it
  means a Pro user's file count won't appear in the sidebar
- The badge needed **size overrides, not just a variant**. shadcn's `Badge` is sized
  for cards (`h-5 px-2 text-xs`) against a 20px sidebar slot; `ProBadge` passes
  `h-4 px-1.5 text-[0.625rem] font-semibold tracking-wide` plus `border-sidebar-border`
  so it sits in the sidebar's palette. Verified in the served HTML that
  `tailwind-merge` actually dropped `h-5`, `border-border`, and `text-foreground` — a
  failed merge would have left both classes and let source order decide
- **Two defects found at `review` and fixed before commit:**
  1. `aria-label` was on a roleless `<span>`, where ARIA in HTML prohibits it and
     screen readers ignore it. The attribute did nothing and PRO would still have been
     announced as a bare token. Added `role="img"` — the same pairing `DominantTypeDot`
     already uses ten lines below in the same file, a precedent sitting in plain sight
  2. A fixed `text-sidebar-foreground/60` opted the badge out of the slot's
     `peer-hover/menu-button:` brightening, so PRO would have sat static while every
     count around it lit up on row hover. The peer variant can't be reapplied to the
     badge directly — `ProBadge` is a descendant of the slot, not a sibling of the
     button — so it switched to `text-inherit opacity-60`, which inherits the color and
     its hover shift while staying dim
- Contrast computed rather than eyeballed: **6.79:1** dark, **5.18:1** light, both
  clear of WCAG AA at any size. Worth the arithmetic given §4 already documents one
  type color that fails the same test
- Also checked rather than assumed: `--color-sidebar-border` and the sidebar color
  tokens genuinely exist in `globals.css`, since a missing token fails silently as no
  border at all. No prettier is configured in this repo, so formatting is lint's
  business only
- Verified: `npm run lint`, `npm run build`, `npx tsc --noEmit` clean before and after
  the review fixes. Served HTML checked row by row — Files and Images carry `PRO` with
  `role="img"`, the label, and the new classes; Snippets 4 / Prompts 3 / Commands 5 /
  Notes 0 / Links 6 unchanged and still totalling 18; collections, "View all
  collections", footer, and the 18 / 5 / 6 / 3 stat cards all untouched
- **Not verified:** no browser automation, so the badge's visual weight beside the
  counts and the hover brightening wired up at `review` went unseen. Collapse-to-icon
  is structural only — `SidebarMenuBadge` carries `group-data-[collapsible=icon]:hidden`
  and the class is present on the Files slot, so PRO hides with the counts, but it
  wasn't watched. Same gap as every round since phase 2
- **Doc drift, flagged not fixed:** the layout sketch in `project-overview.md` §11
  marks Pro types with a `◆` diamond. The spec's badge won as the newer and more
  specific instruction, but §11 now describes something the sidebar doesn't do
- Merged to `main` as `e4f3b40` (feature commit `1df1134`); branch deleted
- Left untracked deliberately: `.claude/` (the `feature` and `list-components` skill
  definitions). They predate this feature and whether tooling config belongs in the
  repo is a separate call, not something to fold into a `feat:` commit
- Carried forward: the flat "Aug 3" item date from the unseeded `Item.createdAt`, and
  the prod Neon branch with no migrations applied and no seed

### 2026-08-06 — Audit fixes (quick wins + index migrations)

- Branch `feature/audit-fixes`, merged to `main` as `933af2a` (feature commit
  `2e33b31`); branch deleted. Never pushed to origin, so nothing to clean up there
- **The whole round came out of a subagent.** `.claude/agents/code-scanner.md` was
  written and verified this session, then run: 0 critical, 0 high, 4 medium, 4 low
  across 21 in-scope files. Its six `Quick wins` became the spec. Every `file:line`
  it cited was re-checked against the tree before the spec was written — all eight
  were exact, which is why the list was trusted enough to batch
- Scope grew at `start`: Troy pulled the two `medium` index findings in, done as real
  migrations, because dev and prod have to end up in sync and prod still has none
- **Queries.** `rankTypesByCollection`'s `itemType.findMany()` had no `where` at all
  and selected every row in `ItemType`; it now scopes to
  `{ OR: [{ userId: null }, { userId }] }` like `getItemTypeCounts` already did.
  `getCurrentUser` is wrapped in React `cache`, and `getCurrentUserId` derives from
  it rather than issuing its own query — Prisma has no request-level dedupe, only
  `fetch` gets that in Next 16. The sidebar's favorites query gained a `take`
- **Measured rather than assumed:** instrumented the resolver and counted the dev
  server log — **one** `User` query per dashboard request, repeatable, down from two.
  The rendered HTML is identical either way, so nothing else would have caught it
- **`src/lib/prisma.ts` now throws on a missing `DATABASE_URL`.** `PoolConfig`'s
  `connectionString` is optional, so an unset variable typechecked and failed later
  as an opaque driver error. Side effect worth knowing: a CI build without the
  variable now fails at page-data collection instead of at runtime
- **Two migrations, both hand-written** — Prisma expresses neither `NULLS LAST` nor a
  partial index. `20260806183738_item_list_sort_index` and
  `20260806183837_collection_name_unique_live`. The second drops
  `@@unique([userId, name])` on `Collection` and replaces it with a partial unique
  index `WHERE "deletedAt" IS NULL`, so deleting a collection and recreating it by
  the same name no longer hits `P2002` against a row the user cannot see
- Removing that `@@unique` was checked first, not assumed: `seedCollections` upserts
  on `id`, and the `userId_name` compound key in the seed belongs to **Tag**
- **The drift risk was resolved empirically.** A `--create-only` probe after both
  migrations generated *"This is an empty migration"* — Prisma ignores partial
  indexes in its diff, so neither `itemtype_system_slug_key` nor the two new ones are
  at risk of being dropped, and it treats `DESC NULLS LAST` as matching its own
  declaration. Probe deleted
- **Gotcha for the next hand-edited migration:** running `migrate dev` after editing
  a `--create-only` file generated a *duplicate* migration with a bare `DROP INDEX`,
  which then failed against the shadow database (`P3006`/`42704`). The dev database
  was never touched — the failure is shadow-only. Deleting the duplicate and re-running
  applied cleanly
- **Goal 7 shipped partial, and that is the one real miss.** Found at `review` by
  asking whether the new index is *used*, not just whether it exists. `EXPLAIN` with
  `enable_seqscan=off` shows the planner picking it for the filter but keeping a
  **Sort node** on top — the exact cost the index was added to remove. Cause,
  isolated by changing one predicate and nothing else: Postgres treats
  `deletedAt IS NULL` as a **NullTest, not an equality**, and will not derive sort
  order from key columns positioned after it. With `deletedAt = now()` the Sort
  disappears; with `IS NULL` it stays
- The fix was verified before being proposed — a partial index keyed
  `(userId, isPinned, lastUsedAt DESC NULLS LAST, createdAt DESC)`
  `WHERE deletedAt IS NULL`, created and dropped inside one transaction so the
  database was left untouched. `EXPLAIN` then shows `Limit → Index Scan`, no Sort.
  **Not applied:** landing it in place needs `prisma migrate reset`, which Troy
  declined. The original index ships — still better than a seq scan for the filter,
  just not the sort. `schema.prisma` carries a `KNOWN LIMITATION` comment
- **Prisma's CLI blocks an AI agent from running `migrate reset` without explicit
  user consent.** That guard is what surfaced the decision rather than letting a
  destructive command through. `.env` and `.env.production` were confirmed to point
  at different Neon endpoints before asking
- **The same NullTest trap applies to the other three list indexes** from `init` —
  all lead `(userId, deletedAt, …)`, so none can supply ordering either. Worth one
  sweep rather than fixing them one at a time
- `AppSidebar` went 302 → 68 lines: a data-fetching shell plus
  `sidebar/TypesGroup.tsx`, `sidebar/CollectionsGroup.tsx`, `sidebar/SidebarUser.tsx`.
  `main()` in `scripts/test-db.ts` became five functions
- Beyond the spec, deliberately: two smoke-test checks proving the partial index
  behaves — a duplicate *live* collection name is rejected, and the name becomes
  reusable once the original is soft-deleted. A new constraint with nothing
  exercising it seemed worse than the small scope creep
- Verified: `db:status` in sync (4 migrations), `db:test` all pass, `lint`,
  `tsc --noEmit`, `build` clean. Queried `pg_indexes` directly to confirm the
  hand-edits survived into Postgres. Served HTML checked entry by entry — stats
  18 / 5 / 6 / 3, Types 4 / 3 / 5 / 0 / 6 / 0 / 0 with PRO on Files and Images, the
  same five collections with dots emerald / orange / emerald / violet / blue, Pinned
  3 + Recent 10. Identical to the previous round
- A dev server was already running on :3000 and Next refuses a second instance for
  the same directory, so verification ran against it via HMR — and its log at
  `.next/dev/logs/next-development.log` is what made the query count observable
- **Not verified:** the favorites cap (3 favorites against a limit of 5) and the
  nulls-last ordering (all 18 items have `lastUsedAt`) are unexercised by this seed.
  No browser automation, so hover, responsive, and collapse-to-icon went unchecked —
  same gap as every round since phase 2
- Minor, flagged not fixed: `getSidebarCollections(userId, recentLimit, favoriteLimit)`
  takes two adjacent unnamed numbers, both `5` today, so swapping them is type-safe
  and currently invisible
- `Collection` name uniqueness now lives **only in SQL** — the generated client no
  longer exposes the `userId_name` compound key
- Left untracked again, deliberately: `.claude/agents/code-scanner.md`. It predates
  this feature and belongs to the same "does tooling config go in the repo" call as
  the skills in `fe99ea5`, not folded into a `fix:` commit
- Carried forward: goal 7's outstanding partial-index fix, the flat "Aug 3" item date
  from the unseeded `Item.createdAt`, and the prod Neon branch with no migrations
  applied and no seed

### 2026-08-08 — Auth phase 1 (NextAuth v5 + GitHub OAuth)

- Branch `feature/auth-phase-1`, merged to `main` as `c42f518` (feature commit
  `771c85c`); branch deleted. All 8 goals met
- **The first round verified end to end against a real external service.** Playwright
  MCP arrived this session, and the dev-server log carries the whole chain:
  `POST /api/auth/signin/github 302` → `GET /api/auth/callback/github?code=… 302` →
  `GET /dashboard 200` with `proxy.ts: 30ms`. Every previous round since phase 2 closed
  with "no browser automation this session"
- Installed `next-auth@5.0.0-beta.32` and `@auth/prisma-adapter@2.11.3`. The `@beta`
  tag is load-bearing — `@latest` still resolves to v4
- **The spec's rationale for the split config is obsolete in Next 16, and the split
  was kept anyway.** Auth.js documents `auth.config.ts` without the adapter as an
  *edge-runtime* workaround; Next 16's upgrade guide states the edge runtime is **not
  supported** in `proxy` and the runtime is `nodejs` and not configurable. So the split
  buys bundle size, not compatibility. It starts earning its keep again in phase 2,
  when bcrypt would otherwise land in a request filter. Recorded in the file's comment
  so the next reader doesn't inherit the stale reason
- **The JWT type augmentation has to target `@auth/core/jwt`, not `next-auth/jwt`.**
  The latter is a bare `export * from "@auth/core/jwt"`, so `JWT` is not declared in
  it — `declare module "next-auth/jwt"` silently defines a *second*, unrelated
  interface. `token.id` stayed `unknown`, which narrows to `{}` inside a truthiness
  check, and `tsc` failed with `Type '{}' is not assignable to type 'string'`. That
  error message names neither the cause nor the file
- No migration, as predicted at `load`: `Account`, `Session`, and `VerificationToken`
  have been in `schema.prisma` since `init`, and `User` already had `passwordHash`,
  `emailVerified`, and `image`. **First feature since the database landed to add zero
  migrations**
- **The database confirmed the JWT strategy rather than the config asserting it.**
  After sign-in: 2 users, 1 `Account` (`provider: github`, `type: oauth`, scope
  `read:user,user:email`, access token stored), and **0 `Session` rows**. A database
  strategy would have written one. The GitHub user has a cuid id, an image, and
  `passwordHash` null — OAuth-only, exactly what the schema comment anticipated
- `AUTH_SECRET` was empty in `.env` and generated with `crypto.randomBytes(32)`,
  patching that one line in place rather than rewriting a file holding live
  credentials. `AUTH_GITHUB_ID` / `_SECRET` were already populated — the OAuth app
  predates this round
- **Two defects found at `review` and fixed before the commit:**
  1. The `session` callback assigned `session.user.id` only under `if (token.id)`,
     but `Session["user"]["id"]` is typed **non-optional** — any path with the claim
     missing would hand callers `undefined` under a `string` type. Now falls back to
     `token.sub`, NextAuth's own copy of the user id on a JWT session, which makes the
     pair genuinely exhaustive instead of merely likely. Phases 2 and 3 both build
     directly on `session.user.id`
  2. `.playwright-mcp/` was untracked and would have gone into the commit — snapshots,
     console logs, and screenshots from the session's browser runs. Added to
     `.gitignore`
- **A stale dev server cost real time and is worth recognising next round.** The one on
  :3000 had been up since Aug 6, two days before `next-auth` was installed, and its
  module graph was stale: `/api/auth/signin` returned **500** behind a
  *"Jest worker encountered 2 child process exceptions"* error that names nothing real.
  A restart fixed it outright. Previous rounds relied on HMR picking changes up, which
  works for edits and **not** for a new dependency
- Related, same cause: `npx tsc --noEmit` failed three times in
  `.next/dev/types/validator.ts` with `TS1434` on a line reading
  `s AppPageConfig<"/dashboard">> = Specific` — a **torn write** by the running dev
  server, not a code error. `rm -rf .next/dev/types` and one request regenerated it
- `.env.example` gained the three `AUTH_*` keys, the callback URL, and the secret
  generation command. Beyond the spec's five files, but it is the repo's only
  onboarding doc for environment variables
- Both open questions from `load` were answered by Troy at `start`, both to the
  recommended default: **`getCurrentUserId()` keeps resolving `demo@devstash.io`**, and
  **`/` stays the scaffold placeholder**. So signing in with GitHub is currently
  invisible — the dashboard still renders the demo user's 18 items, and the GitHub user
  owns 0. Phase 3's sidebar work is where that closes
- **Two environment gaps flagged, not fixed** — neither blocks a dev-only phase, both
  block a deploy: `.env.production` has `AUTH_SECRET=` **empty** (Auth.js throws
  `MissingSecret` at runtime), and its `AUTH_GITHUB_ID` / `_SECRET` appear to be the
  same dev OAuth app, whose callback is `localhost:3000`. A leftover
  `BETTER_AUTH_SECRET` sits in both env files from an earlier experiment
- **Known trap in `proxy.ts`:** it builds its own Auth.js instance from the
  adapter-free config, which carries **no `jwt`/`session` callbacks**. `req.auth` is
  correct for the truthiness check it does today, but `req.auth.user.id` would be
  `undefined` there. Commented in the file
- Verified: `lint`, `tsc --noEmit`, and `build` clean before and after the review
  fixes. The build registers `ƒ Proxy (Middleware)` and `ƒ /api/auth/[...nextauth]`.
  Unauthenticated `/dashboard` returns **307** to
  `/api/auth/signin?callbackUrl=…%2Fdashboard`; the default sign-in page renders the
  GitHub button; the handoff carries `redirect_uri=…/api/auth/callback/github`, PKCE
  `code_challenge_method=S256`, and scope `read:user user:email`
- **Not verified by me:** the GitHub login form itself — that needs Troy's credentials,
  so Troy completed the sign-in and the result was confirmed from the database and the
  server log rather than watched. Sign-*out*, session expiry, and a second sign-in
  linking to the existing `Account` row are all unexercised
- Left untracked again, deliberately, for the third round running: `.claude/` and
  `.mcp.json`. `CLAUDE.md` also has uncommitted changes that **predate this feature**
  (Troy's Neon MCP branch-safety rules) — not folded into a `feat:` commit
- Carried forward: goal 7's outstanding partial-index fix from the audit round, the
  flat "Aug 3" item date from the unseeded `Item.createdAt`, and the prod Neon branch
  with no migrations applied and no seed

### 2026-08-08 — Auth phase 2 (Credentials: email/password + registration)

- Branch `feature/auth-phase-2`, merged to `main` as `6a67bc0` (feature commit
  `9a82f3b`); branch deleted. All 7 goals met
- **The spec's central instruction cannot work, and fails silently.** It says: put
  `authorize: () => null` in `auth.config.ts`, then *override* it in `auth.ts`. The
  literal implementation — `{ ...provider, authorize }` — typechecks, builds, and is
  **discarded at request time**. `Credentials(config)` returns
  `{ …defaults, authorize: () => null, options: config }`, stashing the caller's
  object under `options`; Auth.js then resolves providers with
  `merge(defaults, userOptions, …)` in `@auth/core/lib/utils/providers.js`, so
  `options.authorize` — the placeholder — is applied *over* anything set at the top
  level. The only symptom is `error=CredentialsSignin` on a password you know is
  correct. The fix is to **build a new provider**, not patch the returned one;
  `CREDENTIAL_FIELDS` is exported from `auth.config.ts` so both instances describe the
  same form. Found by testing sign-in, not by reading — nothing static catches it
- **bcrypt silently truncates at 72 bytes.** Verified against bcryptjs 3.0.3:
  `compare("a"×72 + "XXXX", hashOf("a"×72 + "DIFFERENT_TAIL"))` returns **true**.
  Uncapped, a long password from a manager is quietly reduced to its first 72 bytes
  and anything sharing that prefix authenticates. `registerSchema` rejects past the
  limit rather than truncating, measured in **bytes not characters** — 25 emoji is 25
  characters and 100 bytes, so a `.max()` on length would not have caught it
- Installed **`zod` 4.4.3**, the first validation library in the repo, answering
  `coding-standards.md`'s standing "validate all inputs with Zod" against a file that
  did not exist. Zod 4 specifics: `z.email()` is top-level (not `z.string().email()`),
  and `z.flattenError(err).fieldErrors` is the standalone replacement for the
  deprecated `.flatten()`. `src/lib/validations/auth.ts` is the new home, beside
  `src/lib/db/` — the second subdirectory under `lib/`
- **Zero migrations, as predicted at `load`** — `User.passwordHash` has been in the
  schema since `init`. Second feature running to add none, and `db:status` stayed at 4
- `credentialsSchema` deliberately does **not** apply the registration password policy.
  An account created before a policy change must still authenticate; enforcing
  `min(8)` at sign-in would lock a user out of their own row. Only non-empty is
  required — bcrypt decides the rest
- **Three decisions taken at `start`, all to the recommended default:** install Zod;
  reject registration against an email that already has a GitHub account (409, rather
  than attaching a password to an account the requester does not own — that is an
  account-takeover path, not a convenience); and an 8-character minimum with no
  complexity rules
- The register route is a **route handler, not a Server Action**, returning real
  201/400/409 statuses — one of the reasons `coding-standards.md` names for choosing a
  route at all. `isUniqueConstraintError` duck-types `P2002` rather than importing the
  `Prisma` namespace, the same call `src/lib/db/items.ts` made about `Prisma.ItemSelect`.
  The `findUnique` check is not atomic, so the `@unique` on `email` is the real
  guarantee and the catch handles the race
- **The bundle split was measured, not asserted.** Phase 1 claimed the adapter-free
  config buys bundle size and nothing had ever checked. Built
  `.next/server/middleware.js` is **221 bytes** with **zero** references to `bcryptjs`,
  `@prisma/client`, `@prisma/adapter-neon`, `@neondatabase`, or `zod` — in the bundle
  or in its `.nft.json` trace. The split does exactly what it was kept for
- **`session.user.id` verified for a credentials user, which nothing had exercised.**
  The dashboard reads `getCurrentUserId()` (still `demo@devstash.io`), so landing on
  `/dashboard` proves nothing about the session. Fetched `/api/auth/session` directly:
  the id matches the registered row exactly and no `passwordHash` or `$2b$` string
  appears anywhere in the payload. Phase 3 builds straight onto this
- Timing equalization: `authorize` compares against a fixed dummy hash when no account
  matches. Measured — wrong password **956ms**, OAuth-only account **946ms**, unknown
  email **898ms**, indistinguishable; a malformed request short-circuits at the schema
  (**28ms**), which reveals nothing about which accounts exist. Beyond the spec, and
  flagged as such at `review`; **Troy chose to keep it**
- **The database confirmed the strategy again.** After a credentials sign-in: `Session`
  rows **0** and `Account` rows still **1** (the GitHub one). Auth.js writes neither for
  Credentials, which is exactly why the register route has to create the `User` itself
- Verified: `lint`, `tsc --noEmit`, `build`, and `db:test` (all checks) clean. Register
  returns **201** with no `passwordHash` in the response; **409** on a duplicate email
  and on the GitHub account's email; **400** with field-keyed errors on mismatch, short
  password, bad email, blank name, and malformed JSON. The **seeded demo user signs in**
  with `12345678` — validating against a 12-round hash this feature never produced,
  which is a stronger check than round-tripping its own output. Uppercase email
  normalizes. GitHub's handoff is unchanged from phase 1: same scope, `redirect_uri`,
  and PKCE `S256`, with `/api/auth/providers` listing `github, credentials`
- **`/api/auth/register` resolves ahead of the `[...nextauth]` catch-all** beside it —
  Next matches static segments before dynamic ones. First time the app depends on that;
  confirmed in the served response rather than reasoned about
- **Git Bash `curl` mangles multibyte request bodies and nearly produced a false bug
  report.** Emoji passwords returned **201** through curl where they should have been
  rejected, and the stored hash matched none of the candidate strings I could
  reconstruct. The byte cap is correct — proven against the schema directly and via
  `node` `fetch` over real HTTP (**400**). Use `fetch` from a script, not curl, for any
  payload that is not plain ASCII
- The dev server on :3000 picked up both a **new dependency and new route files**
  without a restart this round, unlike phase 1. The stale-server failure mode is real
  but not guaranteed
- **Two gaps flagged at `review`, neither fixed, neither blocking:**
  1. `/api/auth/register` has **no rate limit**. It is unauthenticated, creates rows,
     and burns ~250ms of CPU per call on bcrypt — a cheap account-spam and
     CPU-exhaustion vector. Belongs with `project-overview.md` §12 Q7
  2. **Email case normalization is one-sided.** This route and `authorize` lowercase;
     the GitHub adapter writes whatever GitHub returns, and `User.email` is unique
     *case-sensitively* in Postgres. So `Troy@Example.com` (OAuth) and
     `troy@example.com` (registered) can coexist as two rows for one person. Latent
     until today, because there was only one way to create a user. A real fix is
     adapter-level normalization or a `citext` migration
- Six throwaway accounts were created against the Neon `development` branch while
  testing and **all deleted** with Troy's approval; the branch is back to the demo user
  and the GitHub user. A JWT session outlives the row it names — deleting a user does
  not invalidate their session, which will matter in phase 3 once `getCurrentUserId()`
  reads `session.user.id` instead of resolving the demo account
- **`proxy.ts` now builds an instance whose Credentials provider is the inert
  `() => null`.** Harmless — it only reads the session cookie — but it sits beside the
  existing comment about `req.auth.user.id` being `undefined` there
- Left untracked again, deliberately, for the fourth round running: `.claude/` and
  `.mcp.json`. `CLAUDE.md`'s uncommitted Neon MCP branch-safety rules still **predate
  this feature** and were not folded into a `feat:` commit. `auth-phase-3-spec.md` stays
  untracked for its own round — every prior feature commit carried only its own spec
- Carried forward: goal 7's outstanding partial-index fix from the audit round, the
  flat "Aug 3" item date from the unseeded `Item.createdAt`, `.env.production`'s empty
  `AUTH_SECRET`, and the prod Neon branch with no migrations applied and no seed

### 2026-08-08 — Auth phase 3 (custom sign-in, register, account menu)

- Branch `feature/auth-phase-3`, merged to `main` as `0053420` (feature commit
  `4d2435d`); branch deleted. All 8 goals met
- **The app finally renders whoever is signed in.** `getCurrentUser()` resolves
  `session.user.id` instead of the hardcoded `demo@devstash.io` it has carried since
  the collections round. Proven by signing in as two different accounts and getting
  two different dashboards: 18 / 5 / 6 / 3 for the demo user, all zeros and every
  empty state for a freshly registered one. Those empty states had been "code-read
  only" in four consecutive rounds — exercising them needed a user with no data, which
  is exactly what this feature created
- It reads the **row**, not the token's `name`/`email`/`image` claims. A profile edit
  then shows up on the next request rather than at the next sign-in, and a session
  naming a deleted row resolves to null instead of a ghost
- **Two bugs, both found by testing rather than reading, which is now the pattern for
  three phases running:**
  1. **The account row would not open its menu.** `SidebarMenuButton` returns a
     `<Tooltip>` wrapper instead of the button whenever `tooltip` is set, so
     `DropdownMenuTrigger asChild` handed its click handler and ref to a context
     provider that renders no DOM. It typechecked, built, and rendered; the only
     symptom was a button with no `aria-haspopup`. Dropping the `tooltip` prop fixed
     it. Nothing is lost — the menu's own label repeats the name and email, so a
     collapsed sidebar still identifies the account. **The same shape as phase 2's
     provider bug: a correct-looking composition silently discarded at runtime**
  2. **A session naming a deleted user trapped the account with no way out.** Hit
     live, on a stale cookie left by phase 2's deleted throwaway accounts:
     `getCurrentUser()` returned null, so the sidebar footer never rendered — and the
     footer is where sign-out lives. Empty dashboard, no escape. The dashboard layout
     now redirects on a null user. **The naive version of that fix is an infinite
     loop** — `/dashboard` rejects the session, `/sign-in` sees `auth()` truthy and
     bounces it back — so both auth pages gate on the resolved user instead. A stale
     cookie lands on the form, which is the one thing that can replace it
- Beyond the spec, deliberately, and the only scope creep: that layout redirect. Goal
  1 is what *created* the trap, so shipping it without the guard would have shipped a
  state users cannot leave
- **`SidebarUser` stayed a server component** — Troy's call, rejecting a first pass
  that marked the whole file `'use client'`. The shadcn dropdown primitives are
  already client modules, so a server component can render them and their children
  cross the boundary as props. Only `SignOutMenuItem` needs a handler, so only that is
  29 lines of client code. The two forms are genuinely interactive and are the app's
  first real client-side data flow
- `SIGN_IN_PATH` is one constant shared by `pages.signIn` and `proxy.ts`, so the
  redirect targets cannot drift into two string literals that merely happen to match.
  `pages.error` points at the same page, so a failed GitHub handoff lands on the form
  rather than Auth.js's default error page
- **`toInternalPath` exists because the credentials form navigates itself.**
  `redirect: false` is what lets a rejection render in place with the typed email
  intact, but it also means Auth.js's own same-origin check never runs on
  `callbackUrl`. Unit-tested across 10 inputs: `//evil.example/pwned` gives
  `/dashboard`, `https://evil.example/pwned` gives `/pwned` on localhost, garbage
  gives `/dashboard`
- Both forms validate against the **existing** Zod schemas rather than restating the
  rules in JSX, so the 8-character minimum, the 72-byte bcrypt cap, and the
  passwords-match refinement stay stated once. Confirmed the client pass
  short-circuits: an invalid submit makes **zero** network requests
- `credentialsSchema` gained friendly messages but **no rules** — Zod 4's default
  `min(1)` text reads "Too small: expected string to have >=1 characters". Its
  deliberate lack of a password policy is untouched; applying registration rules at
  sign-in would lock out accounts created under an older policy
- `lucide-react` v1 **dropped its brand icons**, so `Github` no longer exists and the
  mark is an inline SVG. Checked rather than assumed, after `Loader2` / `LoaderCircle`
  raised the question
- **Two defects found at `review` and fixed before the merge:**
  1. `role="alert"` on the success notice — assertive, so it would talk over whatever
     the screen reader was already announcing about the just-loaded page. The role now
     follows the variant: `alert` for errors, `status` for the success notice
  2. The GitHub button disabled the whole form and never re-enabled. The happy path
     navigates away and the promise never settles, but on rejection the form sat
     permanently disabled with nothing said and no retry. Now caught, with
     `OAuthSignin` and `OAuthCallback` added to the error map
- **Zero migrations** — third feature running, and `db:status` stayed at 4. This phase
  touched no schema at all
- The proxy bundle was re-measured after `auth.config.ts` gained an import: still
  **221 bytes**, still zero references to bcrypt, Prisma, Neon, or Zod.
  `auth-routes.ts` is dependency-free precisely so that stays true
- Verified in the browser: custom `/sign-in` renders; a wrong password shows one
  generic inline message with the email preserved and no `?error=` bounce; the demo
  account signs in; the dropdown opens **upward** with its width matching the trigger
  exactly (so `--radix-dropdown-menu-trigger-width` resolved); Profile is a real
  `<a href="/settings">`; sign-out clears the session (`/api/auth/session` returns
  `null`, cookies gone, `/dashboard` redirects); registration redirects to
  `/sign-in?registered=1`; an uppercase email normalizes on both register and sign-in;
  initials render `PT` from "Phase Three Tester". `lint`, `tsc --noEmit`, `build`, and
  `db:test` all clean
- GitHub's handoff is unchanged from phases 1 and 2 — PKCE `S256`,
  `redirect_uri=…/api/auth/callback/github`, scope `read:user user:email`
- **Not verified by me:** completing the GitHub login, which needs Troy's credentials —
  and therefore the avatar's **image** path. Only the initials fallback was exercised
  on screen, though the GitHub user's row does carry an `image`
- **The stale dev server bit again, exactly as phase 1 warned.** The one on :3000
  predated this round's new routes and served a chunk compiled mid-edit, throwing
  `ReferenceError: auth is not defined` from a file whose source was clean, alongside
  the same meaningless "Jest worker encountered 2 child process exceptions". A restart
  fixed both. Phase 2 got away without one; that was luck, not a rule
- **A long detour was spent on dead clicks that turned out not to be the app.** Raw
  `page.mouse` and then `locator.click()` stopped delivering events entirely — a
  control on the always-working sidebar toggle produced zero `pointerdown` events too,
  which is what proved it environmental. Restarting the browser fixed it.
  `devIndicators: false` also appeared in `next.config.ts` mid-session (not mine, kept
  at Troy's request), and the Next dev indicator sits exactly where the account row is,
  so it is an equally good explanation. **Which one it was is unresolved.** The
  `tooltip` / `asChild` bug is independent of both and was confirmed by the attribute
- Lesson worth keeping: when a click does nothing, check whether *any* event reaches
  the document before touching the component. `elementFromPoint` said the trigger was
  on top, which ruled out the overlay theory too early
- One throwaway account was created and **deleted with Troy's approval**. A
  `John Doe / john@gmail.com` row predates this session's testing and was left alone
- **Flagged, not fixed:** the Profile link points at `/settings`, which **does not
  exist yet** and 404s — same as the sidebar's existing `/items/*` and `/collections/*`
  links. `project-overview.md` §7 still says `/login` where the app now serves
  `/sign-in`, the second piece of §7 drift after the PRO badge round's diamond marker.
  Phase 2's two gaps are untouched and now more exposed by a public sign-up page:
  `/api/auth/register` still has **no rate limit**, and email case normalization is
  still one-sided. `AppSidebar`'s `user ? … : null` fallbacks are now unreachable
  behind the layout redirect, left as defence in depth
- Left untracked again, deliberately, for the fifth round running and explicitly at
  Troy's request this time: `.claude/`, `.mcp.json`, and `CLAUDE.md`'s Neon MCP
  branch-safety rules. `next.config.ts`'s `devIndicators: false` **was** included, also
  at Troy's request, despite not originating from this feature
- Carried forward: goal 7's outstanding partial-index fix from the audit round, the
  flat "Aug 3" item date from the unseeded `Item.createdAt`, `.env.production`'s empty
  `AUTH_SECRET`, and the prod Neon branch with no migrations applied and no seed
