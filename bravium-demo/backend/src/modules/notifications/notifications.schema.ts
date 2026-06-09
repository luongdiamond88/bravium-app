import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(["REMINDER", "BUDGET_ALERT", "AI_ALERT"]),
  title: z.string().min(1),
  body: z.string().min(1),
  scheduledFor: z.string().datetime().optional(),
  payload: z.record(z.any()).optional(),
});

export const notificationsByUserParamsSchema = z.object({
  userId: z.string().min(1),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type NotificationsByUserParams = z.infer<
  typeof notificationsByUserParamsSchema
>;
