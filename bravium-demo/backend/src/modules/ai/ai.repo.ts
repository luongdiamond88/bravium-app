import { AiJobStatus, AiJobType, AiOutputType, Prisma } from "@prisma/client";
import { prisma } from "../../config/db";

export async function createAiJob(data: {
  userId: string;
  sessionId?: string;
  type: AiJobType;
  input: Prisma.InputJsonValue;
}) {
  return prisma.aiJob.create({
    data: {
      userId: data.userId,
      sessionId: data.sessionId,
      type: data.type,
      status: AiJobStatus.QUEUED,
      input: data.input,
    },
  });
}

export async function markAiJobRunning(jobId: string) {
  return prisma.aiJob.update({
    where: { id: jobId },
    data: {
      status: AiJobStatus.RUNNING,
      startedAt: new Date(),
    },
  });
}

export async function markAiJobCompleted(jobId: string) {
  return prisma.aiJob.update({
    where: { id: jobId },
    data: {
      status: AiJobStatus.COMPLETED,
      completedAt: new Date(),
    },
  });
}

export async function markAiJobFailed(jobId: string, error: string) {
  return prisma.aiJob.update({
    where: { id: jobId },
    data: {
      status: AiJobStatus.FAILED,
      completedAt: new Date(),
      error,
    },
  });
}

export async function createAiOutput(data: {
  jobId: string;
  userId: string;
  outputType: AiOutputType;
  content: Prisma.InputJsonValue;
}) {
  return prisma.aiOutput.create({
    data: {
      jobId: data.jobId,
      userId: data.userId,
      outputType: data.outputType,
      content: data.content,
    },
  });
}

export async function createAiEventLog(data: {
  userId: string;
  sessionId?: string;
  type: string;
  source: string;
  payload: Prisma.InputJsonValue;
  category?: string;
  correlationId?: string;
}) {
  return prisma.eventLog.create({
    data: {
      userId: data.userId,
      sessionId: data.sessionId,
      type: data.type,
      source: data.source,
      category: data.category ?? "ai",
      correlationId: data.correlationId,
      payload: data.payload,
    },
  });
}

export async function getRecentEventsForSession(data: {
  userId: string;
  sessionId?: string;
  limit?: number;
}) {
  return prisma.eventLog.findMany({
    where: {
      userId: data.userId,
      ...(data.sessionId ? { sessionId: data.sessionId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: data.limit ?? 30,
  });
}

export async function getPendingApprovalsForSession(data: {
  userId: string;
  sessionId?: string;
}) {
  return prisma.approval.findMany({
    where: {
      userId: data.userId,
      status: "REQUESTED",
      ...(data.sessionId ? { sessionId: data.sessionId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function getLatestAlertOutputForSession(data: {
  userId: string;
  sessionId?: string;
}) {
  return prisma.aiOutput.findFirst({
    where: {
      userId: data.userId,
      outputType: "ALERT",
      ...(data.sessionId
        ? {
            job: {
              sessionId: data.sessionId,
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      job: true,
    },
  });
}
