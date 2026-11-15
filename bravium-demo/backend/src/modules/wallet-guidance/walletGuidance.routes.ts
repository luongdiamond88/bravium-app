import type { FastifyInstance } from "fastify";
import {
  generateWalletSplitGuidanceController,
  saveWalletSplitPlanController,
} from "./walletGuidance.controller";

export async function walletGuidanceRoutes(app: FastifyInstance) {
  app.post(
    "/wallet-guidance/split-recommendation",
    generateWalletSplitGuidanceController,
  );

  app.post("/wallet-guidance/save-plan", saveWalletSplitPlanController);
}
