import { z } from "zod";

export const capitalGuardCheckSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  text: z.string().min(1),
  availableBalance: z.number().positive(),
  accountCurrency: z.string().min(1).default("USDT"),
  safetyBuffer: z.number().min(0).default(100),
  windowDays: z.number().int().min(1).max(60).default(14),
  referenceDate: z.string().datetime().optional(),
});

export type CapitalGuardCheckInput = z.infer<typeof capitalGuardCheckSchema>;
