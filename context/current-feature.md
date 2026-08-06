# Current Feature: Audit fixes (quick wins + index migrations)

<!-- Load a spec with /feature load [name] -->

## Status

In Progress — branch `feature/audit-fixes`. All eight goals implemented and
verified; **not committed** (waiting on the commit-type question below).

> **Scope grew at `start`.** The spec originally excluded the two `medium` findings
> because they need migrations. Troy's call: include them, done as proper migrations,
> so the dev and prod Neon branches can be brought into sync — prod currently has no
> migrations applied at all. They are goals 7 and 8 below.

## Goals

Eight fixes from the `code-scanner` audit on 2026-08-06: the six `trivial`/`low`
quick wins, plus the two `medium` index findings added at `start`. No new dependency
and no behavior change a user can see. Goals 1–6 are independently applicable; 7 and
8 each need a migration.

Ordered by value, as the audit ranked them:

- [x] **Scope the type lookup to the user** — `src/lib/db/collections.ts:206`.
      `rankTypesByCollection` already takes `userId` and uses it to scope the raw
      count on line 202, but the sibling `prisma.itemType.findMany()` has no `where`
      at all and selects every row in `ItemType`. Mirror the scoping
      `getItemTypeCounts` already uses: `where: { OR: [{ userId: null }, { userId }] }`.
      The existing `.filter()` on line 225 already tolerates a narrower map, so
      nothing else changes.
- [x] **Kill the duplicate `User` query** — `src/lib/db/user.ts:24`. `AppSidebar`
      calls `getCurrentUser` from the layout and `DashboardPage` calls
      `getCurrentUserId` from the page; both issue the same
      `SELECT … WHERE email = 'demo@devstash.io'` on every request. Prisma has no
      request-level dedupe — only `fetch` gets that in Next 16. Wrap the resolver in
      React's `cache` and derive `getCurrentUserId` from it.
- [x] **Fail loudly on a missing `DATABASE_URL`** — `src/lib/prisma.ts:8`.
      `PoolConfig.connectionString` is optional, so an unset variable typechecks,
      constructs a pool with `undefined`, and surfaces as an opaque Neon error on the
      first query. `scripts/test-db.ts:136` already guards this; the app path does
      not. Throw at module load naming the variable and pointing at `.env.example`.
- [x] **Cap the sidebar's favorites query** — `src/lib/db/collections.ts:128`. The
      Recent query below it takes `recentLimit`; the favorites query above has
      `orderBy` and no `take`. Add a `favoriteLimit` parameter and a `take`, letting
      the existing "View all collections" row absorb the overflow.
- [x] **Split `AppSidebar`** — `src/components/layout/AppSidebar.tsx:139`. The
      exported function spans 139–302 (164 lines) against the "under 50 lines" rule in
      `coding-standards.md`, and the file also holds five presentational helpers plus
      `getInitials` plus its own data fetching. Keep `AppSidebar.tsx` as the async
      data-fetching shell and move out `sidebar/TypesGroup.tsx` (Types collapsible +
      `ProBadge`), `sidebar/CollectionsGroup.tsx` (Collections collapsible +
      `SubGroupLabel`, `EmptyGroupNote`, `CollectionMenuItem`, `DominantTypeDot`), and
      `sidebar/SidebarUser.tsx` (footer + `getInitials`). All three are pure
      presentational server components; the queries are untouched.
- [x] **Break up `main()` in the smoke test** — `scripts/test-db.ts:135`. `main` runs
      135–335 across five unrelated concerns. Extract `checkSeedData()`,
      `checkDemoWorkingSet()`, `checkConstraints()`, `checkCrudRoundTrip()`, leaving
      `main` as the connection probe plus four calls. `failures` is already module
      state, so `check` keeps working unchanged. No behavior change.
- [x] ⚠️ **Index the item list sort** — migration. **Shipped, but does not fully
      achieve its aim — see "Goal 7 is partial" in Notes.** Both list queries order by
      `[lastUsedAt desc nulls last, createdAt desc]`, and no index serves it:
      `Item_userId_deletedAt_lastUsedAt_idx`
      (`20260803185015_init/migration.sql:165`) omits `createdAt` entirely, and a
      Postgres `DESC` index column is `NULLS FIRST`, which does not match the emitted
      `DESC NULLS LAST`. Add
      `("userId", "deletedAt", "isPinned", "lastUsedAt" DESC NULLS LAST, "createdAt" DESC)`
      so both `getPinnedItems` and `getRecentItems` are covered filter-and-sort.
      Prisma cannot express `NULLS LAST` in `@@index`, so the generated SQL is edited
      by hand — the precedent is `20260803185100_system_type_slug_unique`.
- [x] **Make `Collection`'s name uniqueness ignore soft-deleted rows** — migration.
      `@@unique([userId, name])` (`schema.prisma:157`) counts rows with `deletedAt`
      set, so once collection CRUD ships, deleting "React Patterns" and recreating it
      hits `P2002` on a row the user cannot see. Drop the constraint and replace it
      with a partial unique index `WHERE "deletedAt" IS NULL`.

Done when all eight are applied, `npm run db:status` is in sync, `npm run db:test`
passes, `npm run lint` / `npm run build` / `npx tsc --noEmit` are clean, and the
served `/dashboard` HTML is **unchanged in the ways that matter** — stat cards still
18 / 5 / 6 / 3, Types still 4 / 3 / 5 / 0 / 6 / 0 / 0 with PRO on Files and Images,
the same five collections in the same order with the same dominant-type dots, and
Pinned/Recent unchanged.

## Notes

- **Provenance.** These are the `Quick wins` list from the `code-scanner` subagent's
  first real run. The audit found 0 critical, 0 high, 4 medium, 4 low across 21
  in-scope files. Every `file:line` above was independently re-checked against the
  working tree before this spec was written — all eight the audit cited were exact.
- **This is a refactor round, not a feature.** Nothing here is user-visible. The
  guard rail is that the rendered dashboard must not change; if it does, something
  was misapplied.
- **Both index findings are latent, not live.** Nothing is broken today — the free
  cap is 50 items so the missing sort index costs nothing, and no collection delete
  path exists yet so the `P2002` cannot fire. They are in this round because
  retrofitting either after real data exists is the expensive version, which is the
  same argument `project-overview.md` §5 makes for settling schema before data.
- **Migration mechanics, checked before starting:**
  - `npm run db:migrate` (`prisma migrate dev`) only — never `db push`, per
    `CLAUDE.md`. `npm run db:generate` afterwards, since Prisma 7 no longer generates
    on migrate.
  - Both indexes need SQL Prisma cannot express, so each is `migrate dev
    --create-only`, hand-edit, then apply.
  - **Drift risk to watch:** `itemtype_system_slug_key` already exists in the
    database via hand-written SQL but is absent from `schema.prisma`. If Prisma's
    shadow-database diff decides to drop it, the generated SQL must be corrected
    before applying. Check every generated migration for an unexpected `DROP INDEX`.
  - Removing `@@unique([userId, name])` from `Collection` is safe for the seed —
    `seedCollections` upserts on `id` (`prisma/seed.ts:473`), not on `userId_name`.
    The `userId_name` compound key used at `seed.ts:461` and `:493` is **Tag's**, and
    Tag is untouched.
- **Goal 7 is partial — found at `review`, deliberately left.** The index is created
  and the planner does choose it, but **only for the filter**. A `Sort` node still
  sits above the Index Scan, which is the exact cost goal 7 set out to remove.
  - Cause: Postgres treats `deletedAt IS NULL` as a **NullTest, not an equality**, so
    it will not derive sort order from key columns positioned after `deletedAt`.
    Isolated by changing that one predicate and nothing else — with
    `deletedAt = now()` the Sort node disappears; with `IS NULL` it stays.
  - Verified fix, tested by creating and dropping the candidate inside a single
    transaction so the database was left untouched:
    ```sql
    CREATE INDEX "item_user_pinned_recent_live_idx" ON "Item"
      ("userId", "isPinned", "lastUsedAt" DESC NULLS LAST, "createdAt" DESC)
      WHERE "deletedAt" IS NULL;
    ```
    EXPLAIN then shows `Limit → Index Scan` with **no Sort node**. It is also
    narrower, and every read path filters `deletedAt IS NULL` so the partial
    predicate costs no coverage.
  - **Not applied.** Landing it in place means editing an already-applied migration,
    which needs `prisma migrate reset` — Troy declined the reset at `review`, so the
    original index ships as-is. It is still an improvement on nothing (the planner
    uses it for the filter instead of a seq scan); it just doesn't remove the sort.
  - Whoever picks this up: either reset the dev branch and edit
    `20260806183738_item_list_sort_index` in place, or add a follow-up migration that
    drops `Item_userId_deletedAt_isPinned_lastUsedAt_createdAt_idx` and creates the
    partial one. The second is non-destructive but bakes a create-then-drop into
    prod's history. `schema.prisma` carries a matching KNOWN LIMITATION comment.
- **The same NullTest trap applies to the other three list indexes** from `init` —
  they all lead `(userId, deletedAt, …)`. None of them can supply ordering either.
  Worth a sweep whenever the above is picked up, rather than fixing one in isolation.
- Quick win 2 changes `getCurrentUser` to select three extra columns for both
  callers. That's deliberate — cheaper than a second round trip, and the `cache`
  wrapper survives the swap to `auth()` when Auth.js lands.
- Quick win 3 makes the app fail hard at import time on a fresh clone with no `.env`.
  That is the intent, but it does mean the page's "unseeded database" empty state can
  no longer be reached that way — the throw precedes the query.
- No `shadcn add`, no `npm install`. Two migrations are expected; anything beyond
  those two means something has been misread.

## Open Questions

1. **Deploying to prod is not part of this round unless Troy says so.** Goals 7 and 8
   make the migrations exist and apply them to the **dev** Neon branch. Prod has no
   migrations applied at all, so `npm run db:deploy` against it would replay `init`
   and both index migrations from empty, and prod has never been seeded either.
   That is a production action with its own blast radius and needs an explicit go —
   it is not being done silently as part of a cleanup round.
2. **Commit type?** These are not `feat:`. Goals 1–4 read as `perf:` and `fix:`, 5–6
   as `refactor:`, 7–8 as `perf:` and `fix:` with schema changes. One commit for the
   lot, or split code from migrations?

**Resolved at `start`:** the `AppSidebar` split is in (Troy said continue with the
spec as written), and it is one branch — `feature/audit-fixes` — rather than two.

**Resolved at `review`:** goal 7's index ships as originally built. The verified
partial-index fix was declined because landing it needs a `migrate reset` on the dev
branch; recorded above as a follow-up instead. Prisma's own CLI blocks an AI agent
from running `migrate reset` without explicit user consent, which is what surfaced
the decision.

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
