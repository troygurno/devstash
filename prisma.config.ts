// Prisma 7 moves the datasource URL, schema path, and seed command out of
// schema.prisma and into this file. The CLI runs outside Next.js, so nothing loads
// .env for it — hence the explicit dotenv import.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
    // Seeding no longer runs automatically after migrate — invoke `npm run db:seed`.
    seed: "tsx prisma/seed.ts",
  },
});
