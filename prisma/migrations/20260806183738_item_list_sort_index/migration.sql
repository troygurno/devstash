-- Hand-edited: Prisma cannot express NULLS LAST in @@index.
--
-- getPinnedItems and getRecentItems (src/lib/db/items.ts) both filter on
-- (userId, deletedAt, isPinned) and order by
--   [lastUsedAt DESC NULLS LAST, createdAt DESC].
--
-- No existing index serves that. Item_userId_deletedAt_lastUsedAt_idx omits
-- createdAt entirely, and a Postgres DESC index column is NULLS FIRST, which
-- matches neither the emitted ordering nor its exact reverse — so the planner
-- falls back to fetch-all-then-sort-then-limit. Free at the 50-item free cap,
-- expensive for a Pro user with thousands.
--
-- The generated statement is kept verbatim apart from `NULLS LAST`, which Prisma
-- would otherwise drop. schema.prisma carries a matching comment.

-- CreateIndex
CREATE INDEX "Item_userId_deletedAt_isPinned_lastUsedAt_createdAt_idx" ON "Item"("userId", "deletedAt", "isPinned", "lastUsedAt" DESC NULLS LAST, "createdAt" DESC);
