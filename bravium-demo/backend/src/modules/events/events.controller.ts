import type { FastifyReply, FastifyRequest } from "fastify";
import { createEventSchema, sessionEventsParamsSchema } from "./events.schema";
import {
  createEventService,
  getEventsBySessionIdService,
} from "./events.service";

export async function createEventController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createEventSchema.parse(request.body);
  const event = await createEventService(body);

  return reply.code(201).send({
    ok: true,
    event,
  });
}

export async function getEventsBySessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = sessionEventsParamsSchema.parse(request.params);
  const events = await getEventsBySessionIdService(params.id);

  return reply.send({
    ok: true,
    sessionId: params.id,
    events,
  });
}
