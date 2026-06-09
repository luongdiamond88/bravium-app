const API_BASE = import.meta.env.VITE_BACKEND_URL;

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

export async function submitCommunityRequest({
  userId,
  sessionId,
  source,
  question,
  caseSummary,
  riskLevel,
  redFlags,
  recommendedAction,
}) {
  const response = await fetch(`${API_BASE}/community/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      sessionId: sessionId || undefined,
      source,
      question,
      caseSummary,
      riskLevel,
      redFlags,
      recommendedAction,
    }),
  });

  return parseJsonResponse(response);
}
