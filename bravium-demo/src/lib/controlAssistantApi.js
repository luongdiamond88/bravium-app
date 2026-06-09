const API_BASE = import.meta.env.VITE_BACKEND_URL;

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

export async function askControlAssistant({
  userId,
  sessionId,
  questionKey,
  context,
}) {
  const response = await fetch(`${API_BASE}/ai/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      sessionId: sessionId || undefined,
      message: questionKey,
      questionKey,
      context: context || {},
    }),
  });

  return parseJsonResponse(response);
}
