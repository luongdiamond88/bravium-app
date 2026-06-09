import type { FastifyInstance } from "fastify";
import { aiReplyController, aiScamAlertController } from "./ai.controller";

export async function aiRoutes(app: FastifyInstance) {
  app.post("/ai/reply", aiReplyController);
  app.post("/ai/scam-alert", aiScamAlertController);
}
