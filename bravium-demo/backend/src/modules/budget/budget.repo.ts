import { NotificationStatus, NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../config/db";

export async function createBudgetEventLog(data: {
  userId: string;
  sessionId?: string;
  type: string;
  source: string;
  payload: Prisma.InputJsonValue;
}) {
  return prisma.eventLog.create({
    data: {
      userId: data.userId,
      sessionId: data.sessionId,
      type: data.type,
      source: data.source,
      category: "finance",
      payload: data.payload,
    },
  });
}

export async function createFixedExpense(data: {
  userId: string;
  label: string;
  amount: number;
  currency: string;
  dueDay: number;
  recurrence: string;
  category?: string;
  sourceText?: string;
}) {
  return prisma.fixedExpense.create({
    data,
  });
}

export async function getActiveFixedExpenses(userId: string) {
  return prisma.fixedExpense.findMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    orderBy: [{ dueDay: "asc" }, { createdAt: "asc" }],
  });
}

export async function createBudgetNotification(data: {
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
