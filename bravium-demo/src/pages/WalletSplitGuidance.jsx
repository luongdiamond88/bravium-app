import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  generateWalletSplitGuidance,
  saveWalletSplitPlan,
} from "../lib/walletGuidanceApi";

function parseRedFlags(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function WalletCard({ wallet }) {
  return (
    <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
        {wallet.role}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-white">{wallet.label}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-300">{wallet.purpose}</p>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Use for
        </p>
        <ul className="mt-2 space-y-2">
          {wallet.useFor.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-zinc-800 bg-black/20 px-4 py-3 text-sm text-zinc-200"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Avoid for
        </p>
        <ul className="mt-2 space-y-2">
          {wallet.avoidFor.map((item) => (
            <li
              key={item}
              className="rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-sm text-zinc-200"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
        {wallet.controlRule}
      </div>
    </div>
  );
}

export default function WalletSplitGuidance() {
  const [searchParams] = useSearchParams();

  const queryUserId = searchParams.get("userId") || "";
  const querySessionId = searchParams.get("sessionId") || "";
  const querySource = searchParams.get("source") || "manual";
  const queryRiskLevel = searchParams.get("riskLevel") || "unknown";
  const querySummary = searchParams.get("scamAlertSummary") || "";
  const queryRedFlags = parseRedFlags(searchParams.get("redFlags"));

  const [userId, setUserId] = useState(queryUserId || "user_demo_1");
  const [sessionId, setSessionId] = useState(querySessionId);
  const [source, setSource] = useState(querySource);
  const [riskLevel, setRiskLevel] = useState(queryRiskLevel);
  const [scamAlertSummary, setScamAlertSummary] = useState(querySummary);
  const [redFlagsText, setRedFlagsText] = useState(queryRedFlags.join("\n"));
  const [userGoal, setUserGoal] = useState(
    "I want to reduce wallet risk before interacting with unknown projects."
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [saveResult, setSaveResult] = useState(null);

  const redFlags = useMemo(() => {
    return redFlagsText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [redFlagsText]);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setSaveResult(null);

    try {
      const response = await generateWalletSplitGuidance({
        userId: userId.trim(),
        sessionId: sessionId.trim(),
        source: source.trim() || "manual",
        riskLevel: riskLevel.trim() || "unknown",
        scamAlertSummary: scamAlertSummary.trim(),
        redFlags,
        userGoal: userGoal.trim(),
      });

      setRecommendation(response.recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate guidance");
      setRecommendation(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePlan() {
    if (!recommendation?.planId) {
      setError("Missing planId");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await saveWalletSplitPlan({
        userId: userId.trim(),
        sessionId: sessionId.trim(),
        planId: recommendation.planId,
        source,
        understood: true,
        plan: recommendation,
      });

      setSaveResult(response.savedPlan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save plan");
      setSaveResult(null);
    } finally {
      setSaving(false);
    }
  }

  const wallets = recommendation?.wallets;

  return (
    <div className="min-h-screen bg-[#071210] px-6 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#7ceee0]">
            Bravium Wallet Safety
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            3-Wallet Split Guidance
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            This v1 does not create wallets or perform transactions. It explains
            how to separate wallet roles so the user stays in control before
            interacting with risky projects.
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

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
                Source
              </label>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
                Risk Level
              </label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none"
              >
                <option value="unknown">unknown</option>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
              Scam Alert Summary
            </label>
            <textarea
              value={scamAlertSummary}
              onChange={(e) => setScamAlertSummary(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-sm outline-none"
              placeholder="Optional summary from Scam Alert"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
              Red Flags
            </label>
            <textarea
              value={redFlagsText}
              onChange={(e) => setRedFlagsText(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-sm outline-none"
              placeholder="One red flag per line"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
              User Goal
            </label>
            <textarea
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-sm outline-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`mt-5 rounded-xl px-5 py-3 text-sm font-semibold ${
              loading
                ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                : "bg-[#a4f4d9] text-black hover:opacity-90"
            }`}
          >
            {loading ? "Generating..." : "Generate 3-Wallet Guidance"}
          </button>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        {recommendation && (
          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#7ceee0]">
                    Structured Recommendation
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    {recommendation.summary}
                  </h2>
                </div>

                <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200">
                  risk used: {recommendation.riskLevelUsed}
                </div>
              </div>

              {recommendation.scamAlertContext?.redFlags?.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Scam Alert context reused
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {recommendation.scamAlertContext.redFlags.map((flag) => (
                      <span
                        key={flag}
                        className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {wallets && (
              <div className="grid gap-4 lg:grid-cols-3">
                <WalletCard wallet={wallets.vault} />
                <WalletCard wallet={wallets.interaction} />
                <WalletCard wallet={wallets.testing} />
              </div>
            )}

            <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-[#7ceee0]">
                Control checkpoints
              </p>

              <ul className="mt-4 space-y-3">
                {recommendation.controlCheckpoints.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl border border-zinc-800 bg-black/20 px-4 py-3 text-sm text-zinc-200"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleSavePlan}
                disabled={saving}
                className={`mt-5 rounded-xl px-5 py-3 text-sm font-semibold ${
                  saving
                    ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                    : "bg-[#a4f4d9] text-black hover:opacity-90"
                }`}
              >
                {saving ? "Saving..." : "Mark as Understood / Save Plan"}
              </button>

              {saveResult && (
                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  Plan saved · {saveResult.planId}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}