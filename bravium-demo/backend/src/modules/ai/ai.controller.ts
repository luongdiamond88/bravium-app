import type { FastifyReply, FastifyRequest } from "fastify";
import { aiReplySchema, aiScamAlertSchema } from "./ai.schema";
import { aiReplyService, aiScamAlertService } from "./ai.service";

export async function aiReplyController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = aiReplySchema.parse(request.body);
  const result = await aiReplyService(body);

  return reply.code(201).send({
    ok: true,
    jobId: result.jobId,
    output: result.output,
  });
}

export async function aiScamAlertController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = aiScamAlertSchema.parse(request.body);
  const result = await aiScamAlertService(body);

  return reply.code(201).send({
    ok: true,
    jobId: result.jobId,
    output: result.output,
  });
}
