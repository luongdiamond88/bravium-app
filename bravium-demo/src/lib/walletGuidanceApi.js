const API_BASE = import.meta.env.VITE_BACKEND_URL;

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

export async function generateWalletSplitGuidance({
  userId,
  sessionId,
  source,
  riskLevel,
  scamAlertSummary,
  redFlags,
  userGoal,
}) {
  const response = await fetch(
    `${API_BASE}/wallet-guidance/split-recommendation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        sessionId: sessionId || undefined,
        source: source || "manual",
        riskLevel: riskLevel || "unknown",
        scamAlertSummary: scamAlertSummary || undefined,
        redFlags: Array.isArray(redFlags) ? redFlags : [],
        userGoal: userGoal || undefined,
      }),
    },
  );

  return parseJsonResponse(response);
}

export async function saveWalletSplitPlan({
  userId,
  sessionId,
  planId,
  source,
  understood,
  plan,
}) {
  const response = await fetch(`${API_BASE}/wallet-guidance/save-plan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      sessionId: sessionId || undefined,
      planId,
      source: source || "wallet_guidance",
      understood: understood ?? true,
      plan,
    }),
  });

  return parseJsonResponse(response);
}
