import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __vesselPrisma: PrismaClient | undefined;
}

/** Reused across hot-reloads / lambda invocations to avoid exhausting Postgres connections. */
export const prisma =
  globalThis.__vesselPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__vesselPrisma = prisma;
}

export * from "@prisma/client";
