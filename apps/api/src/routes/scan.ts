import { prisma } from "@vessel/db";
import { cachePassenger, getCachedPassenger } from "@vessel/redis";
import type { PassengerCacheEntry, ScanResponse } from "@vessel/shared";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

const scanSchema = z.object({
  qrToken: z.string().min(1),
  gateId: z.string().min(1),
});

/**
 * Loads the passenger cache entry, repairing the cache from Postgres on a miss.
 * Gate scanners hit Redis in the common case; Postgres is only touched on
 * cold cache or when persisting the scan outcome.
 */
async function loadPassenger(qrToken: string): Promise<PassengerCacheEntry | null> {
  const cached = await getCachedPassenger(qrToken);
  if (cached) return cached;

  const passenger = await prisma.passenger.findUnique({ where: { qrToken } });
  if (!passenger) return null;

  const entry: PassengerCacheEntry = {
    passengerId: passenger.id,
    fullName: passenger.fullName,
    category: passenger.category,
    remainingRides: passenger.remainingRides,
  };
  await cachePassenger(qrToken, entry);
  return entry;
}

export const registerScanRoutes: FastifyPluginAsyncZod = async (app) => {
  // Gate-facing hot path: must stay fast under bursty boarding traffic.
  app.post("/", { preHandler: app.authenticate, schema: { body: scanSchema } }, async (request, reply) => {
    const { qrToken, gateId } = request.body;
    const createdById = request.user.sub;

    const passenger = await loadPassenger(qrToken);
    if (!passenger) {
      await prisma.scanEvent.create({ data: { qrToken, gateId, outcome: "INVALID", createdById } });
      const response: ScanResponse = { result: "INVALID" };
      return reply.send(response);
    }

    // Atomic conditional decrement: the WHERE guards against a stale cache read
    // racing with a concurrent scan of the same pass at another gate.
    const { count } = await prisma.passenger.updateMany({
      where: { id: passenger.passengerId, remainingRides: { gt: 0 } },
      data: { remainingRides: { decrement: 1 } },
    });

    if (count === 0) {
      await prisma.scanEvent.create({
        data: {
          passengerId: passenger.passengerId,
          qrToken,
          gateId,
          outcome: "NO_RIDES_REMAINING",
          createdById,
        },
      });
      const response: ScanResponse = {
        result: "NO_RIDES_REMAINING",
        passengerId: passenger.passengerId,
        passengerName: passenger.fullName,
        category: passenger.category,
        remainingRides: 0,
      };
      return reply.send(response);
    }

    const scannedAt = new Date();
    const remainingRides = passenger.remainingRides - 1;

    await Promise.all([
      cachePassenger(qrToken, {
        passengerId: passenger.passengerId,
        fullName: passenger.fullName,
        category: passenger.category,
        remainingRides,
      }),
      prisma.scanEvent.create({
        data: {
          passengerId: passenger.passengerId,
          qrToken,
          gateId,
          outcome: "OK",
          scannedAt,
          createdById,
        },
      }),
    ]);

    const response: ScanResponse = {
      result: "OK",
      passengerId: passenger.passengerId,
      passengerName: passenger.fullName,
      category: passenger.category,
      remainingRides,
      scannedAt: scannedAt.toISOString(),
    };
    return reply.send(response);
  });

  // Admin-facing (not Owner-only): staff need to see who just boarded without
  // getting the full financial reports gated behind /reports/*.
  app.get("/feed", { preHandler: app.authenticate }, async () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [boardedToday, recent] = await Promise.all([
      prisma.scanEvent.count({ where: { outcome: "OK", scannedAt: { gte: startOfToday } } }),
      prisma.scanEvent.findMany({
        where: { outcome: "OK" },
        orderBy: { scannedAt: "desc" },
        take: 15,
        include: { passenger: { select: { fullName: true, category: true, remainingRides: true } } },
      }),
    ]);

    return {
      boardedToday,
      recent: recent.map((s) => ({
        id: s.id,
        passengerName: s.passenger?.fullName ?? "Unknown",
        category: s.passenger?.category ?? "REGULAR",
        remainingRides: s.passenger?.remainingRides ?? 0,
        scannedAt: s.scannedAt,
      })),
    };
  });
};
