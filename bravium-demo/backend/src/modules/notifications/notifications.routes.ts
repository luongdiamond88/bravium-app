import type { FastifyInstance } from "fastify";
import {
  createNotificationController,
  getNotificationsByUserController,
} from "./notifications.controller";

export async function notificationsRoutes(app: FastifyInstance) {
  app.post("/notifications", createNotificationController);
  app.get("/notifications/user/:userId", getNotificationsByUserController);
}
