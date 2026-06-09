import Fastify from "fastify";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { logger } from "./config/logger";
import { prisma } from "./config/db";
import { sessionsRoutes } from "./modules/sessions/sessions.routes";
import { eventsRoutes } from "./modules/events/events.routes";
import { investorViewRoutes } from "./modules/investor-view/investor-view.routes";
import { aiRoutes } from "./modules/ai/ai.routes";
import { approvalsRoutes } from "./modules/approvals/approvals.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { budgetRoutes } from "./modules/budget/budget.routes";
import { capitalGuardRoutes } from "./modules/capital-guard/capitalGuard.routes";
import { communityRoutes } from "./modules/community/community.routes";

export async function buildApp() {
  const app = Fastify({
    loggerInstance: logger,
  });

  await app.register(cors, {
    origin: true,
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    if (error instanceof ZodError) {
      return reply.code(400).send({
        ok: false,
        error: "Validation error",
        details: error.flatten(),
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return reply.code(400).send({
        ok: false,
        error: "Database error",
        code: error.code,
        message: error.message,
      });
    }

    return reply.code(500).send({
      ok: false,
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  });

  app.setNotFoundHandler((request, reply) => {
    return reply.code(404).send({
      ok: false,
      error: "Route not found",
      path: request.url,
    });
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
  await app.register(aiRoutes);
  await app.register(approvalsRoutes);
  await app.register(notificationsRoutes);
  await app.register(budgetRoutes);
  await app.register(capitalGuardRoutes);
  await app.register(communityRoutes);

  return app;
}
