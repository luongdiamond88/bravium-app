import { z } from "zod";

export const createSessionSchema = z.object({
  userId: z.string().min(1),
  deviceId: z.string().min(1).optional(),
  frontendSessionId: z.string().min(1).optional(),
  metadata: z.record(z.any()).optional(),
});

export const sessionIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SessionIdParams = z.infer<typeof sessionIdParamsSchema>;
