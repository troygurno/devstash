# Current Feature

**Database — Neon Postgres + Prisma 7**

Stand up the data layer: a Neon project with dev and prod branches, Prisma 7 wired
through the Neon driver adapter, the full schema from @context/project-overview.md
§6 plus the Auth.js models, an initial migration, and a seed for the seven system
item types. Infrastructure only — the dashboard keeps reading
@src/lib/mock-data.ts until a follow-up swaps it over.

Spec: @context/features/database-spec.md

## Status

Built — migrations applied and seeded against the dev branch

## Goals

- [x] Neon project with a **dev** branch (`DATABASE_URL`) and a **prod** branch
- [x] Install `prisma`, `@prisma/client`, `@prisma/adapter-neon`, `@neondatabase/serverless`
- [x] Prisma 7 prerequisites: `"type": "module"` in `package.json`, `tsconfig.json`
      on `"module": "ESNext"` / `"moduleResolution": "bundler"`
- [x] `prisma.config.ts` at the project root — datasource, schema path, seed command
- [x] `prisma/schema.prisma` — `User`, `ItemType`, `Item`, `Collection`,
      `ItemCollection`, `Tag`, plus `Account`, `Session`, `VerificationToken`
- [x] Indexes and explicit `onDelete` on every relation, per the schema in
      @context/project-overview.md
- [x] Initial migration via `prisma migrate dev` — never `db push`
- [x] Hand-written migration for the partial unique index on system item types
- [x] `prisma/seed.ts` — the 7 system types with fixed IDs so it's idempotent
- [x] `src/lib/prisma.ts` — singleton client on the Neon adapter
- [x] Git-ignore the generated client at `src/generated/prisma`
- [x] Verify: `prisma migrate status` in sync, `npm run build`, `npm run lint`,
      `npx tsc --noEmit` all clean

## Decisions

| #   | Question                                        | Decision                                                                                                                                                                    |
| --- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Soft delete?                                    | **Yes** — nullable `deletedAt` on `Item` and `Collection`. `deletedAt` leads the list indexes, since every list query filters on it before sorting.                          |
| 2   | Public sharing fields?                          | **Yes** — `isPublic` + unique `publicSlug` on both. Unused until the sharing feature; no migration or backfill when it lands.                                                |
| 3   | Does this feature swap the dashboard over?      | **No.** Infra only. `mock-data.ts` still backs the dashboard; moving it is its own feature so a schema bug and a UI bug can't share a commit.                                |
| 4   | How does `DATABASE_URL` get shared?             | `.gitignore` gained `!.env.example`, and `.env.example` documents where to find the Neon dev-branch string.                                                                  |

## Notes

Prisma 7 breaking changes, confirmed against the
[upgrade guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7):

- `prisma-client-js` is deprecated. Use the `prisma-client` generator, where `output`
  is **required** — the client no longer lands in `node_modules`. Import from
  `src/generated/prisma/client`, never `@prisma/client`.
- Prisma ships ESM only. `"type": "module"` has to go in `package.json` — **verify
  `next.config.ts` and `postcss.config.mjs` still load afterward**, since that flag
  changes how every extensionless config file in the repo is interpreted.
- A driver adapter is now mandatory. @context/project-overview.md specifies
  `@prisma/adapter-neon` (over the guide's generic `@prisma/adapter-pg`) so queries
  go over Neon's serverless driver.
- `prisma.config.ts` at the root replaces schema-level config for the datasource URL,
  schema path, and the seed command.
- `prisma generate` **no longer runs automatically** after migrate commands, and
  seeding no longer runs automatically — both are explicit steps now. `--skip-generate`
  and `--skip-seed` are gone.

Project specifics:

- `@@unique([userId, slug])` on `ItemType` will **not** stop duplicate system types —
  Postgres treats `NULL` as distinct, so two rows with `userId = NULL` both pass. Needs
  a hand-written partial unique index, SQL in @context/project-overview.md.
- Migrations always, `db push` never — per the spec and
  @context/coding-standards.md. Dev branch gets `migrate dev`; prod gets
  `migrate deploy` from CI.
- `contentType` lives on `ItemType`, not `Item`; `Item.lastUsedAt` powers "Recently
  used"; `Tag` is scoped by `userId`. All three are deliberate corrections recorded in
  @context/project-overview.md §5.
- `User.isPro` is a cached mirror of Stripe, written only by the webhook handler.
- Search indexes (`pg_trgm`, the `tsvector` column) are **out of scope** — they land
  with the search feature, as raw-SQL migrations.
- Auth.js v5 credentials + Prisma adapter forces `session: { strategy: "jwt" }`. Not
  this feature's problem, but the schema has to support it.
- ~~**Blocked on you:** I can't create the Neon project or read its connection
  string.~~ Resolved — `DATABASE_URL` was in `.env`, dev branch `neondb` on
  `ep-aged-dew-ax53f78e-pooler.c-4.us-east-2.aws.neon.tech`.

### One more Prisma 7 breaking change, found the hard way

`datasource db { url = env("DATABASE_URL") }` is **rejected outright** in Prisma 7
with `P1012` — the `url` property is no longer supported in schema files at all. It
was not in the upgrade guide's summary, and the schema block in
@context/project-overview.md §6 still carries it. The datasource block is now just:

```prisma
datasource db {
  provider = "postgresql"
}
```

The connection string reaches Migrate through `prisma.config.ts` and reaches the
client through the driver adapter. Nothing else.

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
