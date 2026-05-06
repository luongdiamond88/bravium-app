import { z } from "zod";

export const investorLogsParamsSchema = z.object({
  userId: z.string().min(1),
});

export const investorLogsQuerySchema = z.object({
  sessionId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export type InvestorLogsParams = z.infer<typeof investorLogsParamsSchema>;
export type InvestorLogsQuery = z.infer<typeof investorLogsQuerySchema>;
