import type { FastifyInstance } from "fastify";
import {
  approveApprovalController,
  createApprovalController,
  rejectApprovalController,
} from "./approvals.controller";

export async function approvalsRoutes(app: FastifyInstance) {
  app.post("/approvals", createApprovalController);
  app.post("/approvals/:id/approve", approveApprovalController);
  app.post("/approvals/:id/reject", rejectApprovalController);
}
