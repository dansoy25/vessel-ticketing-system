import { prisma } from "@vessel/db";
import { cachePassenger } from "@vessel/redis";
import {
  calculateFare,
  ID_PROOF_REQUIRED_CATEGORIES,
  PAYMENT_REF_REQUIRED_METHODS,
} from "@vessel/shared";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getFareConfig } from "../lib/fareConfig.js";

const categorySchema = z.enum(["REGULAR", "STUDENT", "PWD", "SENIOR", "CHILD_UNDER_7"]);
const paymentMethodSchema = z.enum(["CASH", "GCASH", "CARD"]).optional();

function requirePaymentRef(data: { paymentMethod?: string; paymentRef?: string }, ctx: z.RefinementCtx) {
  if (
    data.paymentMethod &&
    PAYMENT_REF_REQUIRED_METHODS.includes(data.paymentMethod as "GCASH" | "CARD") &&
    !data.paymentRef?.trim()
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["paymentRef"],
      message: "A payment reference number is required for this payment method",
    });
  }
}

const createPassengerSchema = z
  .object({
    fullName: z.string().min(1),
    category: categorySchema,
    idNumber: z.string().optional(),
    idExpiry: z.coerce.date().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    ridesPurchased: z.number().int().positive(),
    paymentMethod: paymentMethodSchema,
    paymentRef: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (ID_PROOF_REQUIRED_CATEGORIES.includes(data.category)) {
      if (!data.idNumber?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["idNumber"],
          message: "A document/ID reference number is required for this category's discount",
        });
      }
      if (!data.idExpiry) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["idExpiry"],
          message: "An ID expiry date is required for this category's discount",
        });
      }
    }
    requirePaymentRef(data, ctx);
  });

const topUpSchema = z
  .object({
    ridesPurchased: z.number().int().positive(),
    paymentMethod: paymentMethodSchema,
    paymentRef: z.string().optional(),
  })
  .superRefine(requirePaymentRef);

function withLastActivity<T extends { updatedAt: Date; scanEvents: { scannedAt: Date }[] }>(
  passenger: T,
) {
  const { scanEvents, ...rest } = passenger;
  const lastScan = scanEvents[0]?.scannedAt;
  const lastActivityAt = lastScan && lastScan > passenger.updatedAt ? lastScan : passenger.updatedAt;
  return { ...rest, lastActivityAt };
}

export const registerPassengerRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/", { preHandler: app.authenticate }, async () => {
    const passengers = await prisma.passenger.findMany({
      orderBy: { createdAt: "desc" },
      include: { scanEvents: { orderBy: { scannedAt: "desc" }, take: 1 } },
    });
    return passengers.map(withLastActivity);
  });

  app.get(
    "/:id",
    { preHandler: app.authenticate, schema: { params: z.object({ id: z.string() }) } },
    async (request, reply) => {
      const passenger = await prisma.passenger.findUnique({
        where: { id: request.params.id },
        include: {
          scanEvents: { orderBy: { scannedAt: "desc" }, take: 20 },
          paymentLogs: {
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { createdBy: { select: { username: true } } },
          },
        },
      });
      if (!passenger) return reply.notFound();
      const { paymentLogs, ...rest } = passenger;
      return {
        ...rest,
        paymentLogs: paymentLogs.map(({ createdBy, ...log }) => ({
          ...log,
          operatorName: createdBy?.username ?? "System",
        })),
      };
    },
  );

  app.post(
    "/",
    { preHandler: app.authenticate, schema: { body: createPassengerSchema } },
    async (request, reply) => {
      const { ridesPurchased, paymentMethod, paymentRef, ...rest } = request.body;
      const fareConfig = await getFareConfig();
      const { baseFare, discountRate, discountAmount, totalFee } = calculateFare(
        fareConfig,
        rest.category,
        ridesPurchased,
      );
      const qrToken = nanoid(24);
      const createdById = request.user.sub;

      const passenger = await prisma.$transaction(async (tx) => {
        const created = await tx.passenger.create({
          data: {
            ...rest,
            totalRides: ridesPurchased,
            remainingRides: ridesPurchased,
            feePaid: totalFee,
            paymentMethod,
            paymentRef,
            qrToken,
          },
        });
        await tx.paymentLog.create({
          data: {
            passengerId: created.id,
            type: "REGISTRATION",
            ridesAdded: ridesPurchased,
            amount: totalFee,
            baseFare,
            discountRate,
            discountAmount,
            paymentMethod,
            paymentRef,
            idNumber: created.idNumber,
            idExpiry: created.idExpiry,
            createdById,
          },
        });
        return created;
      });

      await cachePassenger(qrToken, {
        passengerId: passenger.id,
        fullName: passenger.fullName,
        category: passenger.category,
        remainingRides: passenger.remainingRides,
      });

      return reply.code(201).send(passenger);
    },
  );

  app.post(
    "/:id/topup",
    {
      preHandler: app.authenticate,
      schema: { params: z.object({ id: z.string() }), body: topUpSchema },
    },
    async (request, reply) => {
      const { ridesPurchased, paymentMethod, paymentRef } = request.body;
      const createdById = request.user.sub;

      const existing = await prisma.passenger.findUnique({ where: { id: request.params.id } });
      if (!existing) return reply.notFound();

      const fareConfig = await getFareConfig();
      const { baseFare, discountRate, discountAmount, totalFee } = calculateFare(
        fareConfig,
        existing.category,
        ridesPurchased,
      );

      const passenger = await prisma.$transaction(async (tx) => {
        const updated = await tx.passenger.update({
          where: { id: existing.id },
          data: {
            totalRides: { increment: ridesPurchased },
            remainingRides: { increment: ridesPurchased },
            feePaid: { increment: totalFee },
            paymentMethod,
            paymentRef,
          },
        });
        await tx.paymentLog.create({
          data: {
            passengerId: updated.id,
            type: "TOPUP",
            ridesAdded: ridesPurchased,
            amount: totalFee,
            baseFare,
            discountRate,
            discountAmount,
            paymentMethod,
            paymentRef,
            // Snapshot the ID already on file — top-ups don't re-collect it since
            // category (and therefore discount eligibility) doesn't change here.
            idNumber: existing.idNumber,
            idExpiry: existing.idExpiry,
            createdById,
          },
        });
        return updated;
      });

      // qrToken is untouched above, so the pass stays valid; just refresh the cached balance.
      await cachePassenger(passenger.qrToken, {
        passengerId: passenger.id,
        fullName: passenger.fullName,
        category: passenger.category,
        remainingRides: passenger.remainingRides,
      });

      return passenger;
    },
  );
};
