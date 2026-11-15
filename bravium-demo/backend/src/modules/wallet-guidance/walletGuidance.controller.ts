import type { FastifyReply, FastifyRequest } from "fastify";
import {
  saveWalletSplitPlanSchema,
  walletSplitGuidanceRequestSchema,
} from "./walletGuidance.schema";
import {
  generateWalletSplitGuidanceService,
  saveWalletSplitPlanService,
} from "./walletGuidance.service";

export async function generateWalletSplitGuidanceController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = walletSplitGuidanceRequestSchema.parse(request.body);
  const recommendation = await generateWalletSplitGuidanceService(body);

  return reply.code(201).send({
    ok: true,
    recommendation,
  });
}

export async function saveWalletSplitPlanController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = saveWalletSplitPlanSchema.parse(request.body);
  const savedPlan = await saveWalletSplitPlanService(body);

  return reply.code(201).send({
    ok: true,
    savedPlan,
  });
}
