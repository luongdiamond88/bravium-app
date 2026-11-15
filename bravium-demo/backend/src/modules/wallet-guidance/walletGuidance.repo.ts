import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";

export async function createWalletGuidanceEventLog(data: {
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
      category: "control",
      payload: data.payload,
    },
  });
}
