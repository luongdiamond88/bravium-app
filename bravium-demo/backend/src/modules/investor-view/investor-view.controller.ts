import type { FastifyReply, FastifyRequest } from "fastify";
import {
  investorLogsParamsSchema,
  investorLogsQuerySchema,
} from "./investor-view.schema";
import { getInvestorLogsService } from "./investor-view.service";

export async function getInvestorLogsController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = investorLogsParamsSchema.parse(request.params);
  const query = investorLogsQuerySchema.parse(request.query);

  const result = await getInvestorLogsService({
    userId: params.userId,
    sessionId: query.sessionId,
    limit: query.limit,
  });

  if (!result) {
    return reply.code(404).send({
      ok: false,
      error: "User not found",
    });
  }

  return reply.send({
    ok: true,
    ...result,
  });
}
