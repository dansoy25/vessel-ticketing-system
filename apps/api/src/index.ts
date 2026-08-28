import "dotenv/config";

import closeWithGrace from "close-with-grace";
import { prisma } from "@vessel/db";

import { buildApp } from "./app.js";

const app = buildApp();

closeWithGrace(async ({ err }) => {
  if (err) app.log.error(err);
  await app.close();
  await prisma.$disconnect();
});

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

app
  .listen({ port, host })
  .then(() => app.log.info(`vessel-ticketing api listening on http://${host}:${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
