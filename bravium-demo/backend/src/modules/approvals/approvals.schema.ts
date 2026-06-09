import { z } from "zod";

export const createApprovalSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  actionType: z.string().min(1),
  requestPayload: z.record(z.any()).default({}),
});

export const approvalDecisionParamsSchema = z.object({
  id: z.string().min(1),
});

export const approvalDecisionSchema = z.object({
  decisionReason: z.string().min(1).optional(),
});

export type CreateApprovalInput = z.infer<typeof createApprovalSchema>;
export type ApprovalDecisionParams = z.infer<
  typeof approvalDecisionParamsSchema
>;
export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;
