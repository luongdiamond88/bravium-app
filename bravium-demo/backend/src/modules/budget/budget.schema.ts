import { z } from "zod";

export const budgetParseSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  text: z.string().min(1),
});

export const fixedExpenseCandidateSchema = z.object({
  label: z.string().min(1),
  amount: z.number(),
  currency: z.string().min(1),
  dueDay: z.number().int().min(1).max(31),
  recurrence: z.literal("monthly").default("monthly"),
  category: z.string().optional(),
  sourceText: z.string().optional(),
});

export const saveFixedExpensesSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  candidates: z.array(fixedExpenseCandidateSchema).min(1),
});

export const runBudgetChecksSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  monthlyBudget: z.number().positive().optional(),
  budgetCurrency: z.string().min(1).optional(),
  referenceDate: z.string().datetime().optional(),
});

export type BudgetParseInput = z.infer<typeof budgetParseSchema>;
export type SaveFixedExpensesInput = z.infer<typeof saveFixedExpensesSchema>;
export type RunBudgetChecksInput = z.infer<typeof runBudgetChecksSchema>;
