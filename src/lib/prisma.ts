import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 requires a driver adapter — there is no direct connection any more.
// PrismaNeon routes queries over Neon's serverless driver.
//
// `PoolConfig.connectionString` is optional, so an unset DATABASE_URL typechecks,
// builds a pool around `undefined`, and only fails on the first query as an opaque
// driver error. Fail here instead, naming the variable — the same guard
// scripts/test-db.ts already applies.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set — check .env against .env.example");
}

const adapter = new PrismaNeon({ connectionString });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Single client across hot reloads. Without the global, every dev-server reload
 * leaks another connection pool until Neon starts refusing them.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
