import type { FastifyInstance } from "fastify";
import {
  createEventController,
  getEventsBySessionController,
} from "./events.controller";

export async function eventsRoutes(app: FastifyInstance) {
  app.post("/events", createEventController);
  app.get("/events/session/:id", getEventsBySessionController);
}
