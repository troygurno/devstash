# DevStash

A developer knowledge hub for snippets, commands, prompts, notes, files, images, links and custom types.

## Context Files

Read the following to get the full context of the project:

- @context/project-overview.md
- @context/coding-standards.md
- @context/ai-interaction.md
- @context/current-feature.md

## Commands

```bash
npm run dev     # dev server on http://localhost:3000 (Turbopack)
npm run build   # production build
npm start       # serve the production build
npm run lint    # ESLint CLI directly — there is no `next lint`
npx tsc --noEmit  # typecheck; the build does this too

npm run db:migrate   # prisma migrate dev — the ONLY way to change the schema
npm run db:status    # verify migrations are in sync before committing
npm run db:generate  # regenerate the client; Prisma 7 no longer does this after migrate
npm run db:seed      # seed the 7 system item types; no longer automatic either
npm run db:test      # smoke test: connection, seed, constraints, CRUD, cascades
npm run db:deploy    # prisma migrate deploy — CI/production only
npm run db:studio    # browse the data
```

Never run `prisma db push`. Every structural change is a migration: run it against the
Neon dev branch, commit `prisma/migrations/**` with the code, deploy to prod.

Prisma 7 specifics: the client generates to `src/generated/prisma` (git-ignored) —
import from there, never `@prisma/client`. The connection string lives in
`prisma.config.ts`, not in `schema.prisma`, where `datasource.url` is now rejected.

No test runner is configured yet. If you add one, record its commands here.
