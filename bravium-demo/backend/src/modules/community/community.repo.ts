import { Prisma } from "@prisma/client";
import { prisma } from "../../config/db";

export async function createCommunityRequest(data: {
  userId: string;
  sessionId?: string;
  source: string;
  question: string;
  caseSummary: string;
  riskLevel: string;
  redFlags: string[];
  recommendedAction?: string;
}) {
  return prisma.communityRequest.create({
    data: {
      userId: data.userId,
      sessionId: data.sessionId,
      source: data.source,
      question: data.question,
      caseSummary: data.caseSummary,
      riskLevel: data.riskLevel,
      redFlags: data.redFlags,
      recommendedAction: data.recommendedAction,
      status: "submitted",
    },
  });
}

export async function createCommunityEventLog(data: {
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
      category: "ai",
      payload: data.payload,
    },
  });
}
