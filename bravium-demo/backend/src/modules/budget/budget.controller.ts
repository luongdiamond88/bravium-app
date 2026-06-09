import type { FastifyReply, FastifyRequest } from "fastify";
import {
  budgetParseSchema,
  runBudgetChecksSchema,
  saveFixedExpensesSchema,
} from "./budget.schema";
import {
  budgetParseService,
  runBudgetChecksService,
  saveFixedExpensesService,
} from "./budget.service";

export async function budgetParseController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = budgetParseSchema.parse(request.body);
  const result = await budgetParseService(body);

  return reply.code(201).send({
    ok: true,
    ...result,
  });
}

export async function saveFixedExpensesController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = saveFixedExpensesSchema.parse(request.body);
  const result = await saveFixedExpensesService(body);

  return reply.code(201).send({
    ok: true,
    ...result,
  });
}

export async function runBudgetChecksController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = runBudgetChecksSchema.parse(request.body);
  const result = await runBudgetChecksService(body);

  return reply.code(201).send({
    ok: true,
    ...result,
  });
}
