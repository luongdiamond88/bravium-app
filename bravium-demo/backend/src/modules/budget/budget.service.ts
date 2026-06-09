import { NotificationType } from "@prisma/client";
import type {
  BudgetParseInput,
  RunBudgetChecksInput,
  SaveFixedExpensesInput,
} from "./budget.schema";
import {
  createBudgetEventLog,
  createBudgetNotification,
  createFixedExpense,
  getActiveFixedExpenses,
} from "./budget.repo";

type ParsedCandidate = {
  tempId: string;
  label: string;
  amount: number | null;
  currency: string;
  dueDay: number | null;
  recurrence: "monthly";
  category: string;
  confidence: "high" | "medium" | "low";
  sourceText: string;
};

function inferCategory(label: string) {
  const normalized = label.toLowerCase();

  if (
    normalized.includes("housing") ||
    normalized.includes("rent") ||
    normalized.includes("house")
  ) {
    return "housing";
  }

  if (
    normalized.includes("childcare") ||
    normalized.includes("school") ||
    normalized.includes("kids")
  ) {
    return "education";
  }

  if (
    normalized.includes("netflix") ||
    normalized.includes("spotify") ||
    normalized.includes("youtube")
  ) {
    return "subscription";
  }

  return "general";
}

function extractCurrencyToken(text: string) {
  const match = text.match(
    /(\$|\bUSDT\b|\bUSD\b|\bVND\b|\bVNĐ\b|\bEUR\b|\bGBP\b|\bCAD\b|\bAUD\b)/i,
  );

  return match ? match[1] : null;
}

function normalizeBudgetCurrency(currency?: string | null) {
  const raw = String(currency || "")
    .trim()
    .toUpperCase();

  if (!raw) return "USDT";
  if (raw === "USD" || raw === "USDT" || raw === "$") return "USDT";
  if (raw === "EUR") return "EUR";

  return raw;
}

function isUnsupportedStableDollarBudgetCurrency(currency: string) {
  return !["USDT", "EUR"].includes(normalizeBudgetCurrency(currency));
}

function parseLine(line: string, index: number): ParsedCandidate | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const amountMatch = trimmed.match(/(\d+(?:[.,]\d+)?)/);
  const rawCurrencyToken = extractCurrencyToken(trimmed);
  const dueDayMatch = trimmed.match(/(?:jour|day)\s*(\d{1,2})/i);

  const amount = amountMatch ? Number(amountMatch[1].replace(",", ".")) : null;

  const currency = normalizeBudgetCurrency(rawCurrencyToken || "USDT");
  const dueDay = dueDayMatch ? Number(dueDayMatch[1]) : null;

  let label = trimmed;

  if (amountMatch?.[0]) {
    label = label.replace(amountMatch[0], "");
  }

  if (rawCurrencyToken) {
    label = label.replace(rawCurrencyToken, "");
  }

  if (dueDayMatch?.[0]) {
    label = label.replace(dueDayMatch[0], "");
  }

  label = label
    .replace(/[-–•:,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const confidence =
    amount !== null && dueDay !== null
      ? "high"
      : amount !== null
        ? "medium"
        : "low";

  return {
    tempId: `parsed_expense_${index + 1}`,
    label: label || "Untitled expense",
    amount,
    currency,
    dueDay,
    recurrence: "monthly",
    category: inferCategory(label || ""),
    confidence,
    sourceText: trimmed,
  };
}

function clampDayToMonth(year: number, month: number, dueDay: number) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Math.min(dueDay, lastDay);
}

function buildScheduledDate(referenceDate: Date, dueDay: number) {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();
  const safeDay = clampDayToMonth(year, month, dueDay);

  return new Date(Date.UTC(year, month, safeDay, 8, 0, 0));
}

export async function budgetParseService(input: BudgetParseInput) {
  const lines = input.text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const candidates = lines
    .map((line, index) => parseLine(line, index))
    .filter(Boolean) as ParsedCandidate[];

  const warnings: string[] = [];

  candidates.forEach((candidate) => {
    if (candidate.amount === null) {
      warnings.push(
        `Could not confidently detect amount for: "${candidate.sourceText}"`,
      );
    }

    if (candidate.dueDay === null) {
      warnings.push(
        `Could not confidently detect due day for: "${candidate.sourceText}"`,
      );
    }

    if (isUnsupportedStableDollarBudgetCurrency(candidate.currency)) {
      warnings.push(
        `Detected currency ${candidate.currency} for: "${candidate.sourceText}". No automatic conversion to USDT in v1.`,
      );
    }
  });

  await createBudgetEventLog({
    userId: input.userId,
    sessionId: input.sessionId,
    type: "expense_parsed",
    source: "budget.parse",
    payload: {
      feature: "fixed_expenses",
      inputLineCount: lines.length,
      candidateCount: candidates.length,
      warningsCount: warnings.length,
    },
  });

  return {
    inputLineCount: lines.length,
    candidateCount: candidates.length,
    candidates,
    warnings,
  };
}

export async function saveFixedExpensesService(input: SaveFixedExpensesInput) {
  const savedExpenses = [];

  for (const candidate of input.candidates) {
    const saved = await createFixedExpense({
      userId: input.userId,
      label: candidate.label,
      amount: candidate.amount,
      currency: normalizeBudgetCurrency(candidate.currency),
      dueDay: candidate.dueDay,
      recurrence: candidate.recurrence,
      category: candidate.category,
      sourceText: candidate.sourceText,
    });

    savedExpenses.push(saved);

    await createBudgetEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "expense_saved",
      source: "budget.fixed-expenses",
      payload: {
        feature: "fixed_expenses",
        fixedExpenseId: saved.id,
        label: saved.label,
        amount: saved.amount,
        currency: saved.currency,
        dueDay: saved.dueDay,
      },
    });
  }

  return {
    savedCount: savedExpenses.length,
    savedExpenses,
  };
}

export async function runBudgetChecksService(input: RunBudgetChecksInput) {
  const activeExpenses = await getActiveFixedExpenses(input.userId);
  const referenceDate = input.referenceDate
    ? new Date(input.referenceDate)
    : new Date();

  const currentDay = referenceDate.getUTCDate();
  const reminders = [];

  for (const expense of activeExpenses) {
    const daysUntilDue = expense.dueDay - currentDay;

    if (daysUntilDue >= 0 && daysUntilDue <= 3) {
      const scheduledFor = buildScheduledDate(referenceDate, expense.dueDay);

      const notification = await createBudgetNotification({
        userId: input.userId,
        type: NotificationType.REMINDER,
        title: `${expense.label} due on day ${expense.dueDay}`,
        body: `${expense.label} is coming due soon: ${expense.amount} ${expense.currency}.`,
        scheduledFor,
        payload: {
          feature: "fixed_expenses",
          fixedExpenseId: expense.id,
          dueDay: expense.dueDay,
          amount: expense.amount,
          currency: expense.currency,
        },
      });

      reminders.push(notification);

      await createBudgetEventLog({
        userId: input.userId,
        sessionId: input.sessionId,
        type: "reminder_scheduled",
        source: "budget.run-checks",
        payload: {
          feature: "fixed_expenses",
          fixedExpenseId: expense.id,
          label: expense.label,
          scheduledFor,
        },
      });
    }
  }

  const budgetCurrency = normalizeBudgetCurrency(
    input.budgetCurrency || activeExpenses[0]?.currency || "USDT",
  );

  const comparableExpenses = activeExpenses.filter((expense) => {
    return normalizeBudgetCurrency(expense.currency) === budgetCurrency;
  });

  const projectedFixedExpense = comparableExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  let budgetUsageRatio: number | null = null;
  let budgetAlert = null;

  if (typeof input.monthlyBudget === "number" && input.monthlyBudget > 0) {
    budgetUsageRatio = projectedFixedExpense / input.monthlyBudget;

    if (budgetUsageRatio >= 0.8) {
      budgetAlert = await createBudgetNotification({
        userId: input.userId,
        type: NotificationType.BUDGET_ALERT,
        title: "Fixed expense pressure detected",
        body:
          budgetUsageRatio >= 1
            ? "Projected fixed expenses exceed the monthly budget."
            : "Projected fixed expenses are approaching the monthly budget.",
        payload: {
          feature: "fixed_expenses",
          alertType: "monthly_fixed_expense_pressure",
          budget: input.monthlyBudget,
          projectedFixedExpense,
          budgetCurrency,
          usageRatio: budgetUsageRatio,
        },
      });

      await createBudgetEventLog({
        userId: input.userId,
        sessionId: input.sessionId,
        type: "budget_alert_generated",
        source: "budget.run-checks",
        payload: {
          feature: "fixed_expenses",
          alertType: "monthly_fixed_expense_pressure",
          budget: input.monthlyBudget,
          projectedFixedExpense,
          budgetCurrency,
          usageRatio: budgetUsageRatio,
        },
      });
    }
  }

  return {
    referenceDate: referenceDate.toISOString(),
    activeExpenseCount: activeExpenses.length,
    budgetCurrency,
    projectedFixedExpense,
    budgetUsageRatio,
    reminders,
    reminderCount: reminders.length,
    budgetAlert,
  };
}
