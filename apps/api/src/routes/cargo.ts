import { prisma } from "@vessel/db";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

const createCargoSchema = z.object({
  cargoType: z.string().min(1),
  weight: z.number().positive(),
  fee: z.number().nonnegative(),
  vehiclePlate: z.string().optional(),
});

export const registerCargoRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/", { preHandler: app.authenticate }, async () =>
    prisma.cargoEntry.findMany({ orderBy: { createdAt: "desc" } }),
  );

  app.post(
    "/",
    { preHandler: app.authenticate, schema: { body: createCargoSchema } },
    async (request, reply) => {
      const cargo = await prisma.cargoEntry.create({
        data: { ...request.body, createdById: request.user.sub },
      });
      return reply.code(201).send(cargo);
    },
  );
};
