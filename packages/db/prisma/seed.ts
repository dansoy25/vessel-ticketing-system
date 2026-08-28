import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

config({ path: path.resolve(import.meta.dirname, ".env") });

import { prisma } from "../src/index.js";

const SEED_PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const [admin, owner] = await Promise.all([
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

  const passengerSeeds = [
    { fullName: "Maria Santos", category: "REGULAR" as const, ridesPurchased: 10 },
    { fullName: "Juan Dela Cruz", category: "STUDENT" as const, idNumber: "STU-2026-0042", ridesPurchased: 20 },
    { fullName: "Rosa Reyes", category: "SENIOR" as const, idNumber: "SC-2026-0777", ridesPurchased: 10 },
  ];

  const BASE_FARE_PER_RIDE = 120;
  const CATEGORY_DISCOUNTS: Record<string, number> = {
    REGULAR: 0,
    STUDENT: 0.2,
    PWD: 0.2,
    SENIOR: 0.2,
    CHILD_UNDER_7: 0.5,
  };

  const passengers = await Promise.all(
    passengerSeeds.map(({ ridesPurchased, ...data }) => {
      const totalFee =
        BASE_FARE_PER_RIDE * ridesPurchased * (1 - CATEGORY_DISCOUNTS[data.category]);
      return prisma.passenger.create({
        data: {
          ...data,
          totalRides: ridesPurchased,
          remainingRides: ridesPurchased,
          feePaid: totalFee,
          qrToken: randomUUID(),
          paymentLogs: {
            create: {
              type: "REGISTRATION",
              ridesAdded: ridesPurchased,
              amount: totalFee,
              paymentMethod: "CASH",
              createdById: admin.id,
            },
          },
        },
      });
    }),
  );

  const scanEvents = await Promise.all(
    passengers.slice(0, 2).map((p) =>
      prisma.$transaction(async (tx) => {
        const updated = await tx.passenger.update({
          where: { id: p.id },
          data: { remainingRides: { decrement: 1 } },
        });
        return tx.scanEvent.create({
          data: {
            passengerId: updated.id,
            qrToken: updated.qrToken,
            gateId: "gate-1",
            outcome: "OK",
            createdById: admin.id,
          },
        });
      }),
    ),
  );

  const cargoEntries = await Promise.all(
    [
      { cargoType: "Rice sacks", weight: 250, fee: 500, createdById: admin.id },
      { cargoType: "Motorcycle", weight: 120, fee: 800, vehiclePlate: "ABC-1234", createdById: admin.id },
    ].map((data) => prisma.cargoEntry.create({ data })),
  );

  const expenses = await Promise.all(
    [
      { category: "Fuel", amount: 3000, description: "Diesel refill", createdById: owner.id },
      { category: "Maintenance", amount: 1200, description: "Engine checkup", createdById: owner.id },
    ].map((data) => prisma.expenseLog.create({ data })),
  );

  console.log(
    `Seeded 2 users (admin/${SEED_PASSWORD}, owner/${SEED_PASSWORD}), fare settings, ${passengers.length} passengers, ${scanEvents.length} scan events, ${cargoEntries.length} cargo entries, ${expenses.length} expense logs.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
