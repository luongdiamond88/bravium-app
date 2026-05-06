import type { FastifyReply, FastifyRequest } from "fastify";
import { createSessionSchema, sessionIdParamsSchema } from "./sessions.schema";
import {
  createSessionService,
  getSessionByIdService,
} from "./sessions.service";

export async function createSessionController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createSessionSchema.parse(request.body);
  const session = await createSessionService(body);

  return reply.code(201).send({
    ok: true,
    session,
  });
}

export async function getSessionByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = sessionIdParamsSchema.parse(request.params);
  const session = await getSessionByIdService(params.id);

  if (!session) {
    return reply.code(404).send({
      ok: false,
      error: "Session not found",
    });
  }

  return reply.send({
    ok: true,
    session,
  });
}
