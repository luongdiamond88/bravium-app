import { ApprovalStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/db";

export async function createApproval(data: {
  userId: string;
  sessionId?: string;
  actionType: string;
  requestPayload: Prisma.InputJsonValue;
}) {
  return prisma.approval.create({
    data: {
      userId: data.userId,
      sessionId: data.sessionId,
      actionType: data.actionType,
      requestPayload: data.requestPayload,
      status: ApprovalStatus.REQUESTED,
    },
  });
}

export async function getApprovalById(id: string) {
  return prisma.approval.findUnique({
    where: { id },
  });
}

export async function markApprovalApproved(
  id: string,
  decisionReason?: string,
) {
  return prisma.approval.update({
    where: { id },
    data: {
      status: ApprovalStatus.APPROVED,
      decidedAt: new Date(),
      decisionReason,
    },
  });
}

export async function markApprovalRejected(
  id: string,
  decisionReason?: string,
) {
  return prisma.approval.update({
    where: { id },
    data: {
      status: ApprovalStatus.REJECTED,
      decidedAt: new Date(),
      decisionReason,
    },
  });
}

export async function createApprovalEventLog(data: {
  userId: string;
  sessionId?: string;
  type: string;
  source: string;
  payload: Prisma.InputJsonValue;
  correlationId?: string;
}) {
  return prisma.eventLog.create({
    data: {
      userId: data.userId,
      sessionId: data.sessionId,
      type: data.type,
      source: data.source,
      category: "control",
      correlationId: data.correlationId,
      payload: data.payload,
    },
  });
}
