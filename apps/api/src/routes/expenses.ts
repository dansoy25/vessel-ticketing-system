import { prisma } from "@vessel/db";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";

const createExpenseSchema = z.object({
  category: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().optional(),
});

export const registerExpenseRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get("/", { preHandler: app.authenticate }, async () =>
    prisma.expenseLog.findMany({ orderBy: { createdAt: "desc" } }),
  );

  app.post(
    "/",
    { preHandler: app.authenticate, schema: { body: createExpenseSchema } },
    async (request, reply) => {
      const expense = await prisma.expenseLog.create({
        data: { ...request.body, createdById: request.user.sub },
      });
      return reply.code(201).send(expense);
    },
  );
};
