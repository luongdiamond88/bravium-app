import Fastify from "fastify";
import cors from "@fastify/cors";
import { logger } from "./config/logger";
import { prisma } from "./config/db";
import { sessionsRoutes } from "./modules/sessions/sessions.routes";
import { eventsRoutes } from "./modules/events/events.routes";
import { investorViewRoutes } from "./modules/investor-view/investor-view.routes";

export async function buildApp() {
  const app = Fastify({
    loggerInstance: logger,
  });

  await app.register(cors, {
    origin: true,
  });

  app.get("/health", async () => {
    return {
      ok: true,
      service: "bravium-backend",
      now: new Date().toISOString(),
    };
  });

  app.get("/health/db", async () => {
    await prisma.$queryRaw`SELECT 1`;
    return {
      ok: true,
      db: "connected",
    };
  });

  await app.register(sessionsRoutes);
  await app.register(eventsRoutes);
  await app.register(investorViewRoutes);

  return app;
}
