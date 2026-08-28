import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import Fastify from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";

import authPlugin from "./plugins/auth.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerCargoRoutes } from "./routes/cargo.js";
import { registerExpenseRoutes } from "./routes/expenses.js";
import { registerFareSettingRoutes } from "./routes/fareSettings.js";
import { registerPassengerRoutes } from "./routes/passengers.js";
import { registerReportRoutes } from "./routes/reports.js";
import { registerScanRoutes } from "./routes/scan.js";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      transport:
        process.env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } }
          : undefined,
    },
    trustProxy: true,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(helmet);
  app.register(sensible);
  app.register(cors, { origin: process.env.CORS_ORIGIN?.split(",") ?? true });
  app.register(authPlugin);

  app.get("/health", async () => ({ status: "ok", time: new Date().toISOString() }));

  app.register(registerAuthRoutes, { prefix: "/api/auth" });
  app.register(registerPassengerRoutes, { prefix: "/passengers" });
  app.register(registerCargoRoutes, { prefix: "/cargo" });
  app.register(registerExpenseRoutes, { prefix: "/expenses" });
  app.register(registerFareSettingRoutes, { prefix: "/fare-settings" });
  app.register(registerReportRoutes, { prefix: "/reports" });
  app.register(registerScanRoutes, { prefix: "/scan" });

  return app;
}
