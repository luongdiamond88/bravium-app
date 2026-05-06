import { z } from "zod";

export const createEventSchema = z.object({
  userId: z.string().min(1).optional(),
  deviceId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  type: z.string().min(1),
  source: z.string().min(1),
  category: z.string().min(1).optional(),
  correlationId: z.string().min(1).optional(),
  payload: z.record(z.any()).default({}),
});

export const sessionEventsParamsSchema = z.object({
  id: z.string().min(1),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type SessionEventsParams = z.infer<typeof sessionEventsParamsSchema>;
