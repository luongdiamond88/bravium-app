import type { FastifyInstance } from "fastify";
import {
  budgetParseController,
  runBudgetChecksController,
  saveFixedExpensesController,
} from "./budget.controller";

export async function budgetRoutes(app: FastifyInstance) {
  app.post("/budget/parse", budgetParseController);
  app.post("/budget/fixed-expenses", saveFixedExpensesController);
  app.post("/budget/run-checks", runBudgetChecksController);
}
