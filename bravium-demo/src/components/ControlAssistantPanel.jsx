import { useState } from "react";
import { askControlAssistant } from "../lib/controlAssistantApi";

const QUESTION_OPTIONS = [
  {
    key: "WHY_WARNED",
    label: "Why was I warned?",
  },
  {
    key: "WHAT_AI_DID_THIS_SESSION",
    label: "What did AI do in this session?",
  },
  {
    key: "WHAT_NEEDS_CONFIRMATION",
    label: "What needs my confirmation?",
  },
  {
    key: "WHY_LAST_ACTION_BLOCKED",
    label: "Why was the last action blocked?",
  },
];

function normalizeReply(data) {
  const output = data?.output || {};
  const content = output?.content || {};

  return {
    jobId: data?.jobId || "",
    outputId: output?.id || "",
    title: content.title || "AI Control Assistant",
    answer: content.answer || "No answer returned.",
    bullets: Array.isArray(content.bullets) ? content.bullets : [],
    confidence: content.confidence || "unknown",
  };
}

export default function ControlAssistantPanel({
  userId,
  sessionId,
  scamAlertResult,
}) {
  const [loadingKey, setLoadingKey] = useState("");
  const [error, setError] = useState("");
  const [reply, setReply] = useState(null);

  async function handleAsk(questionKey) {
    if (!userId || !sessionId) {
      setError("Missing userId or sessionId");
      return;
    }

    setLoadingKey(questionKey);
    setError("");

    try {
      const response = await askControlAssistant({
        userId,
        sessionId,
        questionKey,
        context: {
          feature: "scam_alert",
          currentRiskLevel: scamAlertResult?.riskLevel || null,
          currentSummary: scamAlertResult?.summary || null,
          redFlags: scamAlertResult?.redFlags || [],
        },
      });

      setReply(normalizeReply(response));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get AI reply");
    } finally {
      setLoadingKey("");
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-6">
      <p className="text-xs uppercase tracking-[0.25em] text-[#7ceee0]">
        Control Assistant
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        Ask AI about the current system state
      </h2>
      <p className="mt-2 text-sm text-zinc-300">
        This assistant explains the active session, alerts, approvals, and
        blocked actions. It does not chat freely.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {QUESTION_OPTIONS.map((item) => (
          <button
            key={item.key}
            onClick={() => void handleAsk(item.key)}
            disabled={loadingKey.length > 0}
            className={`rounded-2xl border px-4 py-4 text-left text-sm transition ${
              loadingKey === item.key
                ? "cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500"
                : "border-zinc-700 bg-black/20 text-zinc-200 hover:bg-white/5"
            }`}
          >
            {loadingKey === item.key ? "Loading..." : item.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {reply && (
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/20 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                AI Reply
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {reply.title}
              </h3>
            </div>

            <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300">
              confidence: {reply.confidence}
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-200">{reply.answer}</p>

          {reply.bullets.length > 0 && (
            <ul className="mt-4 space-y-2">
              {reply.bullets.map((bullet, index) => (
                <li
                  key={`${bullet}-${index}`}
                  className="rounded-xl border border-zinc-800 bg-black/20 px-4 py-3 text-sm text-zinc-300"
                >
                  {bullet}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs text-zinc-500">Job ID</p>
              <p className="mt-1 break-all text-sm text-zinc-200">
                {reply.jobId || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs text-zinc-500">Output ID</p>
              <p className="mt-1 break-all text-sm text-zinc-200">
                {reply.outputId || "-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
