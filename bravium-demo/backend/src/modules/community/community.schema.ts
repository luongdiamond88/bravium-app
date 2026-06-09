import { z } from "zod";

export const createCommunityRequestSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  source: z.string().min(1),
  question: z.string().min(1),
  caseSummary: z.string().min(1),
  riskLevel: z.string().min(1),
  redFlags: z.array(z.string()).default([]),
  recommendedAction: z.string().optional(),
});

export type CreateCommunityRequestInput = z.infer<
  typeof createCommunityRequestSchema
>;
