import type { CapitalGuardCheckInput } from "./capitalGuard.schema";
import {
  createCapitalGuardEventLog,
  getActiveFixedExpensesForUser,
} from "./capitalGuard.repo";

function extractCurrencyToken(text: string) {
  const match = text.match(
    /(\$|\bUSDT\b|\bUSD\b|\bVND\b|\bVNĐ\b|\bEUR\b|\bGBP\b|\bCNY\b|\bJPY\b|\bCAD\b|\bAUD\b)/i,
  );

  return match ? match[1] : null;
}

function normalizeStableDollarCurrency(currency?: string | null) {
  const raw = String(currency || "")
    .trim()
    .toUpperCase();

  if (!raw) return "USDT";
  if (raw === "USD" || raw === "USDT" || raw === "$") return "USDT";
  if (raw === "VNĐ") return "VND";

  return raw;
}

function detectAction(text: string) {
  const raw = text.toLowerCase();

  if (/\b(buy|mua|beli|comprar|compra|compro|acheter|achete|achat)\b/.test(raw))
    return "buy";
  if (
    /\b(invest|investing|investment|dau tu|đầu tư|investasi|berinvestasi|invertir|invierto|inversion|investir|j investis|investissement)\b/.test(
      raw,
    )
  )
    return "invest";

  return "invest";
}

function detectAsset(text: string) {
  const raw = text.toLowerCase();

  if (/\b(btc|bitcoin)\b/.test(raw)) return "BTC";
  if (/\b(eth|ethereum)\b/.test(raw)) return "ETH";
  if (/\b(sol|solana)\b/.test(raw)) return "SOL";

  return "UNKNOWN";
}

function detectTimeContext(text: string) {
  const raw = text.toLowerCase();

  if (/\b(now|right now|today)\b/.test(raw)) return "now";
  if (/\b(maintenant, aujourd hui)\b/.test(raw)) return "now";
  if (/\b(ahora, hoy)\b/.test(raw)) return "now";
  if (/\b(sekarang, hari ini)\b/.test(raw)) return "now";
  if (/\b(hôm nay|hom nay|bây giờ|bay gio)\b/.test(raw)) return "now";

  return null;
}

function parseInvestmentIntent(text: string) {
  const amountMatch = text.match(/(\d+(?:[.,]\d+)?)/);
  const currencyToken = extractCurrencyToken(text);
  const amount = amountMatch ? Number(amountMatch[1].replace(",", ".")) : null;

  const action = detectAction(text);
  const asset = detectAsset(text);
  const timeContext = detectTimeContext(text);
  const currency = normalizeStableDollarCurrency(currencyToken || "USDT");

  let confidence: "high" | "medium" | "low" = "low";

  if (action && amount !== null && asset !== "UNKNOWN") {
    confidence = "high";
  } else if (amount !== null) {
    confidence = "medium";
  }

  return {
    action,
    amount,
    currency,
    asset,
    timeContext,
    confidence,
    sourceText: text,
  };
}

function clampDayToMonth(year: number, month: number, dueDay: number) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Math.min(dueDay, lastDay);
}

function getNextDueDate(referenceDate: Date, dueDay: number) {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();
  const currentDay = referenceDate.getUTCDate();

  if (dueDay >= currentDay) {
    const safeDay = clampDayToMonth(year, month, dueDay);
    return new Date(Date.UTC(year, month, safeDay, 0, 0, 0));
  }

  const nextMonthDate = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
  const nextYear = nextMonthDate.getUTCFullYear();
  const nextMonth = nextMonthDate.getUTCMonth();
  const safeDay = clampDayToMonth(nextYear, nextMonth, dueDay);

  return new Date(Date.UTC(nextYear, nextMonth, safeDay, 0, 0, 0));
}

function diffDays(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export async function capitalGuardCheckService(input: CapitalGuardCheckInput) {
  const parsedIntent = parseInvestmentIntent(input.text);
  const referenceDate = input.referenceDate
    ? new Date(input.referenceDate)
    : new Date();

  const accountCurrency = normalizeStableDollarCurrency(input.accountCurrency);
  const warnings: string[] = [];

  await createCapitalGuardEventLog({
    userId: input.userId,
    sessionId: input.sessionId,
    type: "investment_intent_parsed",
    source: "capital-guard.parse",
    payload: {
      parsedIntent,
    },
  });

  await createCapitalGuardEventLog({
    userId: input.userId,
    sessionId: input.sessionId,
    type: "capital_guard_check_started",
    source: "capital-guard.rule-engine",
    payload: {
      availableBalance: input.availableBalance,
      accountCurrency,
      safetyBuffer: input.safetyBuffer,
      windowDays: input.windowDays,
    },
  });

  const allExpenses = await getActiveFixedExpensesForUser(input.userId);

  const comparableExpenses = allExpenses.filter((expense) => {
    return normalizeStableDollarCurrency(expense.currency) === accountCurrency;
  });

  const unsupportedExpenses = allExpenses.filter((expense) => {
    return normalizeStableDollarCurrency(expense.currency) !== accountCurrency;
  });

  if (unsupportedExpenses.length > 0) {
    warnings.push(
      `Ignored ${unsupportedExpenses.length} fixed expense(s) with unsupported currency for this demo check.`,
    );
  }

  const upcomingItems = comparableExpenses
    .map((expense) => {
      const nextDueDate = getNextDueDate(referenceDate, expense.dueDay);
      const daysUntilDue = diffDays(referenceDate, nextDueDate);

      return {
        id: expense.id,
        label: expense.label,
        amount: expense.amount,
        currency: normalizeStableDollarCurrency(expense.currency),
        dueDay: expense.dueDay,
        daysUntilDue,
      };
    })
    .filter(
      (expense) =>
        expense.daysUntilDue >= 0 && expense.daysUntilDue <= input.windowDays,
    )
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const upcomingTotal = upcomingItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const requestedAmount = parsedIntent.amount ?? 0;
  const investableAmountRaw =
    input.availableBalance - upcomingTotal - input.safetyBuffer;
  const investableAmount = Math.max(0, Number(investableAmountRaw.toFixed(2)));

  let status: "safe" | "caution" | "blocked" = "safe";
  let message =
    "This investment is within the current safe amount after fixed expenses and safety buffer.";
  let maxRecommendedAmount = investableAmount;

  if (investableAmount <= 0) {
    status = "blocked";
    message =
      "You should not invest right now. Upcoming obligations and safety buffer already consume the currently available amount.";
    maxRecommendedAmount = 0;
  } else if (requestedAmount > investableAmount) {
    status = "caution";
    message =
      "The requested amount is above the current safe amount. Consider reducing the investment to the recommended maximum.";
    maxRecommendedAmount = investableAmount;
  }

  const response = {
    parsedIntent,
    ruleConfig: {
      windowDays: input.windowDays,
      safetyBuffer: input.safetyBuffer,
      accountCurrency,
    },
    obligations: {
      upcomingCount: upcomingItems.length,
      upcomingTotal: Number(upcomingTotal.toFixed(2)),
      items: upcomingItems,
    },
    capitalGuard: {
      availableBalance: input.availableBalance,
      requestedAmount,
      investableAmount,
      maxRecommendedAmount,
      status,
      message,
    },
    warnings,
  };

  await createCapitalGuardEventLog({
    userId: input.userId,
    sessionId: input.sessionId,
    type: "capital_guard_check_completed",
    source: "capital-guard.rule-engine",
    payload: {
      status,
      requestedAmount,
      investableAmount,
      upcomingTotal,
      upcomingCount: upcomingItems.length,
      safetyBuffer: input.safetyBuffer,
    },
  });

  if (status === "caution") {
    await createCapitalGuardEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "capital_guard_warning_generated",
      source: "capital-guard.rule-engine",
      payload: {
        requestedAmount,
        maxRecommendedAmount,
        message,
      },
    });
  }

  if (status === "blocked") {
    await createCapitalGuardEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "capital_guard_blocked",
      source: "capital-guard.rule-engine",
      payload: {
        requestedAmount,
        investableAmount,
        message,
      },
    });
  }

  return response;
}
