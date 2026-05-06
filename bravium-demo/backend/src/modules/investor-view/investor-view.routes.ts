import type { FastifyInstance } from "fastify";
import { getInvestorLogsController } from "./investor-view.controller";

export async function investorViewRoutes(app: FastifyInstance) {
  app.get("/investor/logs/:userId", getInvestorLogsController);
}
