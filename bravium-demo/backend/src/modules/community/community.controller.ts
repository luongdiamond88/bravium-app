import type { FastifyReply, FastifyRequest } from "fastify";
import { createCommunityRequestSchema } from "./community.schema";
import { createCommunityRequestService } from "./community.service";

export async function createCommunityRequestController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createCommunityRequestSchema.parse(request.body);
  const communityRequest = await createCommunityRequestService(body);

  return reply.code(201).send({
    ok: true,
    communityRequest,
  });
}
