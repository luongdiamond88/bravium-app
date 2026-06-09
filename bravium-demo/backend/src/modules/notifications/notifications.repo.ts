import { NotificationStatus, NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../config/db";

export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledFor?: Date;
  payload?: Prisma.InputJsonValue;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      status: NotificationStatus.PENDING,
      scheduledFor: data.scheduledFor,
      payload: data.payload,
    },
  });
}

export async function getNotificationsByUserId(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createNotificationEventLog(data: {
  userId: string;
  type: string;
  source: string;
  payload: Prisma.InputJsonValue;
  correlationId?: string;
}) {
  return prisma.eventLog.create({
    data: {
      userId: data.userId,
      type: data.type,
      source: data.source,
      category: "finance",
      correlationId: data.correlationId,
      payload: data.payload,
    },
  });
}
