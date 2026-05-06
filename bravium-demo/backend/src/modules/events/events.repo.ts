import { prisma } from "../../config/db";
import type { CreateEventInput } from "./events.schema";

export async function createEventLog(
  data: CreateEventInput & { category?: string },
) {
  return prisma.eventLog.create({
    data: {
      userId: data.userId,
      deviceId: data.deviceId,
      sessionId: data.sessionId,
      type: data.type,
      source: data.source,
      category: data.category,
      correlationId: data.correlationId,
      payload: data.payload,
    },
  });
}

export async function getEventsBySessionId(sessionId: string) {
  return prisma.eventLog.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
}
