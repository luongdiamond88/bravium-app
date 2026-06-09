import type { FastifyReply, FastifyRequest } from "fastify";
import { capitalGuardCheckSchema } from "./capitalGuard.schema";
import { capitalGuardCheckService } from "./capitalGuard.service";

export async function capitalGuardCheckController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = capitalGuardCheckSchema.parse(request.body);
  const result = await capitalGuardCheckService(body);

  return reply.code(201).send({
    ok: true,
    ...result,
  });
}