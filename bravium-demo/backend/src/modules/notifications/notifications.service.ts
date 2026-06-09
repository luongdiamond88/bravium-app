import { NotificationType } from "@prisma/client";
import type { CreateNotificationInput } from "./notifications.schema";
import {
  createNotification,
  createNotificationEventLog,
  getNotificationsByUserId,
} from "./notifications.repo";

export async function createNotificationService(
  input: CreateNotificationInput,
) {
  const notification = await createNotification({
    userId: input.userId,
    type: NotificationType[input.type],
    title: input.title,
    body: input.body,
    scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
    payload: input.payload,
  });

  if (notification.type === "REMINDER") {
    await createNotificationEventLog({
      userId: notification.userId,
      type: "reminder_scheduled",
      source: "notifications",
      correlationId: notification.id,
      payload: {
        notificationId: notification.id,
        title: notification.title,
        scheduledFor: notification.scheduledFor,
      },
    });
  }

  if (notification.type === "BUDGET_ALERT") {
    await createNotificationEventLog({
      userId: notification.userId,
      type: "budget_alert_generated",
      source: "notifications",
      correlationId: notification.id,
      payload: {
        notificationId: notification.id,
        title: notification.title,
        scheduledFor: notification.scheduledFor,
      },
    });
  }

  return notification;
}

export async function getNotificationsByUserIdService(userId: string) {
  return getNotificationsByUserId(userId);
}
