import path from "node:path";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

config({ path: path.resolve(import.meta.dirname, ".env") });

import { prisma } from "../src/index.js";

/**
 * Idempotent bootstrap for a freshly-created database: ensures the default
 * admin/owner logins and fare settings exist, without touching demo data.
 * Safe to run on every boot (upserts only) — unlike prisma/seed.ts, which
 * also creates throwaway demo passengers/cargo/expenses and is dev-only.
 */
const DEFAULT_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "password123";

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await Promise.all([
    prisma.user.upsert({
      where: { username: "admin" },
      update: {},
      create: { username: "admin", passwordHash, role: "ADMIN" },
    }),
    prisma.user.upsert({
      where: { username: "owner" },
      update: {},
      create: { username: "owner", passwordHash, role: "OWNER" },
    }),
  ]);

  await prisma.fareSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      baseFarePerRide: 120,
      studentDiscount: 0.2,
      pwdDiscount: 0.2,
      seniorDiscount: 0.2,
      childDiscount: 0.5,
    },
  });

  console.log("Ensured default admin/owner users and fare settings exist.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
