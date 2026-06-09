const API_BASE = import.meta.env.VITE_BACKEND_URL;

console.log("SCAM ALERT API_BASE =", API_BASE);

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

export async function submitScamAlert({
  userId,
  sessionId,
  inputType,
  rawInput,
}) {
  const response = await fetch(`${API_BASE}/ai/scam-alert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      sessionId: sessionId || undefined,
      input: {
        inputType,
        rawInput,
      },
    }),
  });

  return parseJsonResponse(response);
}

export async function requestScamAlertApproval({
  userId,
  sessionId,
  inputType,
  rawInput,
  result,
}) {
  const response = await fetch(`${API_BASE}/approvals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      sessionId: sessionId || undefined,
      actionType: "continue_after_high_risk",
      requestPayload: {
        feature: "scam_alert",
        inputType,
        rawInput,
        riskLevel: result?.riskLevel || "unknown",
        recommendedAction: result?.recommendedAction || "",
        redFlags: result?.redFlags || [],
        summary: result?.summary || "",
      },
    }),
  });

  return parseJsonResponse(response);
}
