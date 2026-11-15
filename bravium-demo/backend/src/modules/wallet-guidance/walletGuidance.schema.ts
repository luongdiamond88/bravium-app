import { z } from "zod";

export const walletSplitGuidanceRequestSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  source: z.string().min(1).default("manual"),
  riskLevel: z.enum(["low", "medium", "high", "unknown"]).default("unknown"),
  scamAlertSummary: z.string().optional(),
  redFlags: z.array(z.string()).default([]),
  userGoal: z.string().optional(),
});

export const saveWalletSplitPlanSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  planId: z.string().min(1),
  source: z.string().min(1).default("wallet_guidance"),
  understood: z.boolean().default(true),
  plan: z.any().optional(),
});

export type WalletSplitGuidanceRequestInput = z.infer<
  typeof walletSplitGuidanceRequestSchema
>;

export type SaveWalletSplitPlanInput = z.infer<
  typeof saveWalletSplitPlanSchema
>;
