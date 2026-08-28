import { prisma } from "@vessel/db";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { getFareConfig } from "../lib/fareConfig.js";

const updateFareSettingSchema = z.object({
  baseFarePerRide: z.number().positive(),
  studentDiscountPercent: z.number().min(0).max(100),
  pwdDiscountPercent: z.number().min(0).max(100),
  seniorDiscountPercent: z.number().min(0).max(100),
  childDiscountPercent: z.number().min(0).max(100),
});

export const registerFareSettingRoutes: FastifyPluginAsyncZod = async (app) => {
  // Any authenticated staff can read the live rates (Admin needs them for the fee calculator).
  app.get("/", { preHandler: app.authenticate }, async () => getFareConfig());

  app.put(
    "/",
    { preHandler: app.requireRole(["OWNER"]), schema: { body: updateFareSettingSchema } },
    async (request) => {
      const {
        baseFarePerRide,
        studentDiscountPercent,
        pwdDiscountPercent,
        seniorDiscountPercent,
        childDiscountPercent,
      } = request.body;

      const data = {
        baseFarePerRide,
        studentDiscount: studentDiscountPercent / 100,
        pwdDiscount: pwdDiscountPercent / 100,
        seniorDiscount: seniorDiscountPercent / 100,
        childDiscount: childDiscountPercent / 100,
      };

      await prisma.fareSetting.upsert({
        where: { id: "default" },
        update: data,
        create: { id: "default", ...data },
      });

      return getFareConfig();
    },
  );
};
