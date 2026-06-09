const API_BASE = import.meta.env.VITE_BACKEND_URL;

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

export async function runCapitalGuardCheck({
  userId,
  sessionId,
  text,
  availableBalance,
  accountCurrency,
  safetyBuffer,
  windowDays,
}) {
  const response = await fetch(`${API_BASE}/capital-guard/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      sessionId: sessionId || undefined,
      text,
      availableBalance,
      accountCurrency,
      safetyBuffer,
      windowDays,
    }),
  });

  return parseJsonResponse(response);
}
