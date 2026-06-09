const API_BASE = import.meta.env.VITE_BACKEND_URL;

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

export async function parseFixedExpenses({ userId, sessionId, text }) {
  const response = await fetch(`${API_BASE}/budget/parse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      sessionId: sessionId || undefined,
      text,
    }),
  });

  return parseJsonResponse(response);
}

export async function saveFixedExpenses({ userId, sessionId, candidates }) {
  const response = await fetch(`${API_BASE}/budget/fixed-expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      sessionId: sessionId || undefined,
      candidates,
    }),
  });

  return parseJsonResponse(response);
}

export async function runBudgetChecks({
  userId,
  sessionId,
  monthlyBudget,
  budgetCurrency,
  referenceDate,
}) {
  const response = await fetch(`${API_BASE}/budget/run-checks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      sessionId: sessionId || undefined,
      monthlyBudget,
      budgetCurrency,
      referenceDate: referenceDate || undefined,
    }),
  });

  return parseJsonResponse(response);
}
