import { prisma } from "../../config/db";

type GetInvestorLogsRepoInput = {
  userId: string;
  sessionId?: string;
  limit: number;
};

export async function getInvestorUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function getInvestorSessions(userId: string, sessionId?: string) {
  return prisma.session.findMany({
    where: {
      userId,
      ...(sessionId ? { id: sessionId } : {}),
    },
    orderBy: { startedAt: "desc" },
    include: {
      device: {
        select: {
          id: true,
          deviceCode: true,
          label: true,
          platform: true,
          status: true,
        },
      },
    },
  });
}

export async function getInvestorEvents(input: GetInvestorLogsRepoInput) {
  return prisma.eventLog.findMany({
    where: {
      userId: input.userId,
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: input.limit,
  });
}

export async function getInvestorAiJobs(input: GetInvestorLogsRepoInput) {
  return prisma.aiJob.findMany({
    where: {
      userId: input.userId,
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: input.limit,
    include: {
      outputs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function getInvestorApprovals(input: GetInvestorLogsRepoInput) {
  return prisma.approval.findMany({
    where: {
      userId: input.userId,
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: input.limit,
  });
}
