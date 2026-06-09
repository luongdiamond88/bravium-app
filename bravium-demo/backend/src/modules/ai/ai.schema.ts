import { z } from "zod";

export const aiReplySchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  message: z.string().min(1),
  questionKey: z
    .enum([
      "WHY_WARNED",
      "WHAT_AI_DID_THIS_SESSION",
      "WHAT_NEEDS_CONFIRMATION",
      "WHY_LAST_ACTION_BLOCKED",
    ])
    .optional(),
  context: z.record(z.any()).optional(),
});

export const aiScamAlertSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  input: z.record(z.any()).default({}),
});

export type AiReplyInput = z.infer<typeof aiReplySchema>;
export type AiScamAlertInput = z.infer<typeof aiScamAlertSchema>;