import type { FastifyInstance } from "fastify";
import {
  createSessionController,
  getSessionByIdController,
} from "./sessions.controller";

export async function sessionsRoutes(app: FastifyInstance) {
  app.post("/sessions", createSessionController);
  app.get("/sessions/:id", getSessionByIdController);
}
