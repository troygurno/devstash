-- Hand-edited: Prisma cannot express a partial unique index in schema.prisma, so
-- the DROP below is generated and the CREATE is written by hand. Same technique as
-- 20260803185100_system_type_slug_unique.
--
-- @@unique([userId, name]) on Collection counted soft-deleted rows. Collection has
-- deletedAt, and every read path filters it, so once collection CRUD ships a user
-- who deletes "React Patterns" and creates it again hits P2002 against a row they
-- cannot see or recover — the only ways out being a hard delete or a rename.
--
-- Latent today: no delete path exists yet. It is fixed now because retrofitting it
-- after real data exists means a migration plus a dedupe pass over live rows, which
-- is the trade context/project-overview.md §5 argues for settling before data lands.

-- DropIndex
DROP INDEX "Collection_userId_name_key";

-- CreateIndex: uniqueness among live rows only.
CREATE UNIQUE INDEX "collection_user_name_live_key"
  ON "Collection" ("userId", "name")
  WHERE "deletedAt" IS NULL;
