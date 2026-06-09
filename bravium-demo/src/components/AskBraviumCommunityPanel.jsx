import { useMemo, useState } from "react";
import { submitCommunityRequest } from "../lib/communityApi";

export default function AskBraviumCommunityPanel({
  userId,
  sessionId,
  scamAlertResult,
}) {
  const [question, setQuestion] = useState(
    "Does anyone see anything else risky here?",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(null);

  const disabled = useMemo(() => {
    return !userId || !scamAlertResult;
  }, [userId, scamAlertResult]);

  async function handleSubmit() {
    if (!userId) {
      setError("Missing userId");
      return;
    }

    if (!scamAlertResult) {
      setError("Missing Scam Alert result");
      return;
    }

    if (!question.trim()) {
      setError("Please enter a question for the community.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await submitCommunityRequest({
        userId,
        sessionId,
        source: "scam_alert",
        question: question.trim(),
        caseSummary: scamAlertResult.summary || "",
        riskLevel: scamAlertResult.riskLevel || "unknown",
        redFlags: scamAlertResult.redFlags || [],
        recommendedAction: scamAlertResult.recommendedAction || "",
      });

      setSubmitted(response.communityRequest || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
      setSubmitted(null);
    } finally {
      setLoading(false);
    }
  }

  if (!scamAlertResult) return null;

  return (
    <div className="mt-6 rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-[#7ceee0]">
        Ask Bravium Community
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        Add a community layer after AI analysis
      </h2>
      <p className="mt-2 text-sm text-zinc-300">
        AI analyzed the case first. If you want a social/community angle, you
        can escalate this case without replacing the control boundary.
      </p>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/20 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Case summary
            </p>
            <p className="mt-2 text-sm text-zinc-200">
              {scamAlertResult.summary}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Risk level
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-200">
              {scamAlertResult.riskLevel}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Red flags
          </p>

          {Array.isArray(scamAlertResult.redFlags) &&
          scamAlertResult.redFlags.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {scamAlertResult.redFlags.map((flag, index) => (
                <li
                  key={`${flag}-${index}`}
                  className="rounded-xl border border-zinc-800 bg-black/20 px-4 py-3 text-sm text-zinc-200"
                >
                  {flag}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">
              No red flags attached to this case.
            </p>
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Recommended action
          </p>
          <p className="mt-2 text-sm text-zinc-200">
            {scamAlertResult.recommendedAction}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
          Question for community
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-sm outline-none"
          placeholder="Does anyone see anything else risky here?"
        />
      </div>

      <div className="mt-5">
        <button
          onClick={handleSubmit}
          disabled={disabled || loading}
          className={`rounded-xl px-5 py-3 text-sm font-semibold ${
            disabled || loading
              ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
              : "bg-[#a4f4d9] text-black hover:opacity-90"
          }`}
        >
          {loading ? "Submitting..." : "Submit to Community"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {submitted && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <p className="font-semibold">Community request submitted</p>
          <p className="mt-1">request id: {submitted.id}</p>
          <p className="mt-1">status: {submitted.status}</p>
        </div>
      )}
    </div>
  );
}
