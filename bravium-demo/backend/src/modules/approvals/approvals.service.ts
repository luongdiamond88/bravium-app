import type {
  ApprovalDecisionInput,
  CreateApprovalInput,
} from "./approvals.schema";
import {
  createApproval,
  createApprovalEventLog,
  getApprovalById,
  markApprovalApproved,
  markApprovalRejected,
} from "./approvals.repo";

export async function createApprovalService(input: CreateApprovalInput) {
  const approval = await createApproval(input);

  await createApprovalEventLog({
    userId: approval.userId,
    sessionId: approval.sessionId ?? undefined,
    type: "user_approval_requested",
    source: "approvals",
    correlationId: approval.id,
    payload: {
      approvalId: approval.id,
      actionType: approval.actionType,
      requestPayload: approval.requestPayload,
    },
  });

  return approval;
}

export async function approveApprovalService(
  id: string,
  input: ApprovalDecisionInput,
) {
  const existing = await getApprovalById(id);

  if (!existing) {
    return { notFound: true as const };
  }

  if (existing.status !== "REQUESTED") {
    return { invalidState: true as const, approval: existing };
  }

  const approval = await markApprovalApproved(id, input.decisionReason);

  await createApprovalEventLog({
    userId: approval.userId,
    sessionId: approval.sessionId ?? undefined,
    type: "user_approved",
    source: "approvals",
    correlationId: approval.id,
    payload: {
      approvalId: approval.id,
      actionType: approval.actionType,
      decisionReason: approval.decisionReason,
    },
  });

  await createApprovalEventLog({
    userId: approval.userId,
    sessionId: approval.sessionId ?? undefined,
    type: "action_executed",
    source: "approvals",
    correlationId: approval.id,
    payload: {
      approvalId: approval.id,
      actionType: approval.actionType,
      decisionReason: approval.decisionReason,
    },
  });

  return { approval };
}

export async function rejectApprovalService(
  id: string,
  input: ApprovalDecisionInput,
) {
  const existing = await getApprovalById(id);

  if (!existing) {
    return { notFound: true as const };
  }

  if (existing.status !== "REQUESTED") {
    return { invalidState: true as const, approval: existing };
  }

  const approval = await markApprovalRejected(id, input.decisionReason);

  await createApprovalEventLog({
    userId: approval.userId,
    sessionId: approval.sessionId ?? undefined,
    type: "user_rejected",
    source: "approvals",
    correlationId: approval.id,
    payload: {
      approvalId: approval.id,
      actionType: approval.actionType,
      decisionReason: approval.decisionReason,
    },
  });

  await createApprovalEventLog({
    userId: approval.userId,
    sessionId: approval.sessionId ?? undefined,
    type: "action_blocked",
    source: "approvals",
    correlationId: approval.id,
    payload: {
      approvalId: approval.id,
      actionType: approval.actionType,
      decisionReason: approval.decisionReason,
    },
  });

  return { approval };
}
