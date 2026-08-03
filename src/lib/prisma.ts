import { PrismaNeon } from "@prisma/adapter-neon";

import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 requires a driver adapter — there is no direct connection any more.
// PrismaNeon routes queries over Neon's serverless driver.
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

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
