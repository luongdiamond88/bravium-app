import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";

export async function getActiveFixedExpensesForUser(userId: string) {
  return prisma.fixedExpense.findMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    orderBy: [{ dueDay: "asc" }, { createdAt: "asc" }],
  });
}

export async function createCapitalGuardEventLog(data: {
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
