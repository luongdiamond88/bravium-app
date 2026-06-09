import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { runCapitalGuardCheck } from "../lib/capitalGuardApi";

function statusClass(status) {
  if (status === "safe") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
  if (status === "caution") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  }
  if (status === "blocked") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }
  return "border-zinc-700 bg-zinc-900/60 text-zinc-300";
}

export default function CapitalGuard() {
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get("userId") || "";
  const querySessionId = searchParams.get("sessionId") || "";

  const [userId, setUserId] = useState(queryUserId || "user_demo_1");
  const [sessionId, setSessionId] = useState(querySessionId);
  const [text, setText] = useState("buy 300 usdt btc now?");
  const [availableBalance, setAvailableBalance] = useState("1000");
  const [accountCurrency, setAccountCurrency] = useState("USDT");
  const [safetyBuffer, setSafetyBuffer] = useState("100");
  const [windowDays, setWindowDays] = useState("14");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (queryUserId) {
      setUserId(queryUserId);
    }

    if (querySessionId) {
      setSessionId(querySessionId);
    }
  }, [queryUserId, querySessionId]);

  async function handleCheck() {
    if (!userId.trim()) {
      setError("Missing userId");
      return;
    }

    if (!text.trim()) {
      setError("Please enter an investment request.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await runCapitalGuardCheck({
        userId: userId.trim(),
        sessionId: sessionId.trim(),
        text: text.trim(),
        availableBalance: Number(availableBalance),
        accountCurrency: accountCurrency.trim() || "USDT",
        safetyBuffer: Number(safetyBuffer),
        windowDays: Number(windowDays),
      });

      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Capital Guard check failed",
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const guard = result?.capitalGuard;
  const parsed = result?.parsedIntent;
  const obligations = result?.obligations;
  const warnings = result?.warnings || [];

  return (
    <div className="min-h-screen bg-[#071210] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#7ceee0]">
            Bravium Capital Guard
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            Pre-Investment Safety Check
          </h1>
          <p className="mt-2 text-sm text-zinc-300">
            Before investing, the system checks upcoming fixed obligations and
            safety buffer. Human still makes the final decision.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
                User ID
              </label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
                Session ID
              </label>
              <input
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none"
                placeholder="optional"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
              Investment request
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-sm outline-none"
              placeholder="buy 300 usdt btc now?"
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
                Available Balance
              </label>
              <input
                value={availableBalance}
                onChange={(e) => setAvailableBalance(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
                Account Currency
              </label>
              <input
                value={accountCurrency}
                onChange={(e) => setAccountCurrency(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
                Safety Buffer
              </label>
              <input
                value={safetyBuffer}
                onChange={(e) => setSafetyBuffer(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
                Window Days
              </label>
              <input
                value={windowDays}
                onChange={(e) => setWindowDays(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none"
              />
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={handleCheck}
              disabled={loading}
              className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                loading
                  ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                  : "bg-[#a4f4d9] text-black hover:opacity-90"
              }`}
            >
              {loading ? "Checking..." : "Run Capital Guard"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
                    Capital Guard Result
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Decision</h2>
                </div>

                <div
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${statusClass(
                    guard?.status,
                  )}`}
                >
                  {guard?.status || "unknown"}
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-zinc-200">
                {guard?.message}
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                  <p className="text-xs text-zinc-500">Requested Amount</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {guard?.requestedAmount ?? "-"} {parsed?.currency || ""}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                  <p className="text-xs text-zinc-500">Upcoming Obligations</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {obligations?.upcomingTotal ?? "-"}{" "}
                    {result?.ruleConfig?.accountCurrency || ""}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                  <p className="text-xs text-zinc-500">Investable Amount</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {guard?.investableAmount ?? "-"}{" "}
                    {result?.ruleConfig?.accountCurrency || ""}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                  <p className="text-xs text-zinc-500">Max Recommended</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {guard?.maxRecommendedAmount ?? "-"}{" "}
                    {result?.ruleConfig?.accountCurrency || ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
                Parsed investment intent
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-5">
                <div>
                  <p className="text-xs text-zinc-500">Action</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    {parsed?.action || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Amount</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    {parsed?.amount ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Currency</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    {parsed?.currency || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Asset</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    {parsed?.asset || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Time Context</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    {parsed?.timeContext || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
                Upcoming obligations
              </p>

              {obligations?.items?.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {obligations.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-zinc-800 bg-black/20 px-4 py-3"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {item.label}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            due day {item.dueDay} · in {item.daysUntilDue}{" "}
                            day(s)
                          </p>
                        </div>

                        <div className="text-sm text-zinc-200">
                          {item.amount} {item.currency}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-400">
                  No upcoming fixed obligations found within the current window.
                </p>
              )}
            </div>

            {warnings.length > 0 && (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                  Warnings
                </p>
                <ul className="mt-4 space-y-2">
                  {warnings.map((warning, index) => (
                    <li
                      key={`${warning}-${index}`}
                      className="rounded-xl border border-yellow-500/10 bg-black/20 px-4 py-3 text-sm text-zinc-200"
                    >
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
