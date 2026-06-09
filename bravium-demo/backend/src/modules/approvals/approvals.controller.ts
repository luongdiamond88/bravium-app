import type { FastifyReply, FastifyRequest } from "fastify";
import {
  approvalDecisionParamsSchema,
  approvalDecisionSchema,
  createApprovalSchema,
} from "./approvals.schema";
import {
  approveApprovalService,
  createApprovalService,
  rejectApprovalService,
} from "./approvals.service";

export async function createApprovalController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const body = createApprovalSchema.parse(request.body);
  const approval = await createApprovalService(body);

  return reply.code(201).send({
    ok: true,
    approval,
  });
}

export async function approveApprovalController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = approvalDecisionParamsSchema.parse(request.params);
  const body = approvalDecisionSchema.parse(request.body);

  const result = await approveApprovalService(params.id, body);

  if ("notFound" in result) {
    return reply.code(404).send({
      ok: false,
      error: "Approval not found",
    });
  }

  if ("invalidState" in result) {
    return reply.code(409).send({
      ok: false,
      error: "Approval is not in REQUESTED state",
      approval: result.approval,
    });
  }

  return reply.send({
    ok: true,
    approval: result.approval,
  });
}

export async function rejectApprovalController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const params = approvalDecisionParamsSchema.parse(request.params);
  const body = approvalDecisionSchema.parse(request.body);

  const result = await rejectApprovalService(params.id, body);

  if ("notFound" in result) {
    return reply.code(404).send({
      ok: false,
      error: "Approval not found",
    });
  }

  if ("invalidState" in result) {
    return reply.code(409).send({
      ok: false,
      error: "Approval is not in REQUESTED state",
      approval: result.approval,
    });
  }

  return reply.send({
    ok: true,
    approval: result.approval,
  });
}