const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

export async function fetchInvestorLogs({ userId, sessionId }) {
  if (!userId) {
    throw new Error("Missing userId");
  }

  const url = new URL(`/investor/logs/${userId}`, API_BASE);

  if (sessionId) {
    url.searchParams.set("sessionId", sessionId);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error || data?.message || "Failed to load investor logs",
    );
  }

  return data;
}
