-- Hand-written: Prisma cannot express a partial unique index in schema.prisma.
--
-- @@unique([userId, slug]) on ItemType does NOT prevent duplicate system types.
-- Postgres treats NULL values as distinct, so two rows with userId = NULL and
-- slug = 'snippets' both satisfy that constraint. This index closes the gap for
-- system types while leaving per-user custom types alone.

CREATE UNIQUE INDEX "itemtype_system_slug_key"
  ON "ItemType" ("slug")
  WHERE "userId" IS NULL;
