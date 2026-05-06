import { prisma } from "../../config/db";
import type { CreateSessionInput } from "./sessions.schema";

export async function findSessionByFrontendSessionId(
  frontendSessionId: string,
) {
  return prisma.session.findUnique({
    where: { frontendSessionId },
  });
}

export async function createSession(data: CreateSessionInput) {
  return prisma.session.create({
    data: {
      userId: data.userId,
      deviceId: data.deviceId,
      frontendSessionId: data.frontendSessionId,
      metadata: data.metadata,
    },
  });
}

export async function getSessionById(id: string) {
  return prisma.session.findUnique({
    where: { id },
    include: {
      device: true,
      user: true,
    },
  });
}
