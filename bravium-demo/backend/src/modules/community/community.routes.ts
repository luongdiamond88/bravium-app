import type { FastifyInstance } from "fastify";
import { createCommunityRequestController } from "./community.controller";

export async function communityRoutes(app: FastifyInstance) {
  app.post("/community/requests", createCommunityRequestController);
}
