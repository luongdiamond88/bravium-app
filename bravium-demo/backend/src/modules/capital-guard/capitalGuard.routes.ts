import type { FastifyInstance } from "fastify";
import { capitalGuardCheckController } from "./capitalGuard.controller";

export async function capitalGuardRoutes(app: FastifyInstance) {
  app.post("/capital-guard/check", capitalGuardCheckController);
}
