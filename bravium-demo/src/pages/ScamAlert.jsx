import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { requestScamAlertApproval, submitScamAlert } from "../lib/scamAlertApi";
import ControlAssistantPanel from "../components/ControlAssistantPanel";
import AskBraviumCommunityPanel from "../components/AskBraviumCommunityPanel";

function normalizeScamAlertResult(data) {
  const output = data?.output || {};
  const content = output?.content || {};

  const redFlags = Array.isArray(content.red_flags)
    ? content.red_flags
    : Array.isArray(content.redFlags)
      ? content.redFlags
      : Array.isArray(content.matchedSignals)
        ? content.matchedSignals
        : [];

  const riskLevel = String(
    content.risk_level || content.riskLevel || "unknown",
  ).toLowerCase();

  const needsUserAttention =
    typeof content.needs_user_attention === "boolean"
      ? content.needs_user_attention
      : riskLevel === "high" || riskLevel === "medium";

  return {
    jobId: data?.jobId || "",
    outputId: output?.id || "",
    summary: content.summary || "No summary returned.",
    redFlags,
    riskLevel,
    confidence: content.confidence || "unknown",
    recommendedAction:
      content.recommended_action ||
      content.recommendedAction ||
      content.recommendation ||
      "No recommendation returned.",
    needsUserAttention,
    requiresApproval:
      typeof content.requiresApproval === "boolean"
        ? content.requiresApproval
        : needsUserAttention,
    analysisProvider:
      content.analysis_provider || content.analysisProvider || "unknown",
    rawContent: content,
  };
}

function riskClass(riskLevel) {
  if (riskLevel === "high") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }
  if (riskLevel === "medium") {
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  }
  if (riskLevel === "low") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
  return "border-zinc-700 bg-zinc-900/60 text-zinc-300";
}

export default function ScamAlert() {
  const [searchParams] = useSearchParams();
  const querySessionId = searchParams.get("sessionId") || "";
  const queryUserId = searchParams.get("userId") || "";

  const [userId, setUserId] = useState(queryUserId || "user_demo_1");
  const [sessionId, setSessionId] = useState("");
  const [inputType, setInputType] = useState("link");
  const [rawInput, setRawInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [error, setError] = useState("");
  const [approvalMessage, setApprovalMessage] = useState("");

  const [approvalId, setApprovalId] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("");
  const [approvalActionType, setApprovalActionType] = useState("");

  const [result, setResult] = useState(null);

  useEffect(() => {
    if (querySessionId) {
      setSessionId(querySessionId);
    }

    if (queryUserId) {
      setUserId(queryUserId);
    }
  }, [querySessionId, queryUserId]);

  const showApprovalAction = useMemo(() => {
    if (!result) return false;
    return result.riskLevel === "high" || result.requiresApproval;
  }, [result]);

  async function handleAnalyze() {
    if (!userId.trim()) {
      setError("Missing userId");
      return;
    }

    if (!rawInput.trim()) {
      setError("Please paste a link, contract, text, or project description.");
      return;
    }

    setLoading(true);
    setError("");
    setApprovalMessage("");
    setApprovalId("");
    setApprovalStatus("");
    setApprovalActionType("");

    try {
      const response = await submitScamAlert({
        userId: userId.trim(),
        sessionId: sessionId.trim(),
        inputType,
        rawInput: rawInput.trim(),
      });

      setResult(normalizeScamAlertResult(response));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyze failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestApproval() {
    if (!result) return;

    setApprovalLoading(true);
    setError("");
    setApprovalMessage("");

    try {
      const response = await requestScamAlertApproval({
        userId: userId.trim(),
        sessionId: sessionId.trim(),
        inputType,
        rawInput: rawInput.trim(),
        result,
      });

      const approval = response?.approval;

      setApprovalId(approval?.id || "");
      setApprovalStatus(approval?.status || "REQUESTED");
      setApprovalActionType(approval?.actionType || "continue_after_high_risk");
      setApprovalMessage(
        `Approval request created: ${approval?.id || "success"}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval request failed");
      setApprovalId("");
      setApprovalStatus("");
      setApprovalActionType("");
    } finally {
      setApprovalLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#071210] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#7ceee0]">
            Bravium AI Feature
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Scam Alert</h1>
          <p className="mt-2 text-sm text-zinc-300">
            AI analyzes risk. Human stays in control.
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
                placeholder="user_demo_1"
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
              Input Type
            </label>
            <select
              value={inputType}
              onChange={(e) => setInputType(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none"
            >
              <option value="link">Link</option>
              <option value="contract">Contract</option>
              <option value="text">Text</option>
              <option value="project_description">Project Description</option>
            </select>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
              Paste Input
            </label>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={8}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-sm outline-none"
              placeholder="Paste a suspicious message, link, contract, or project description..."
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                loading
                  ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                  : "bg-[#a4f4d9] text-black hover:opacity-90"
              }`}
            >
              {loading ? "Analyzing..." : "Analyze"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {approvalMessage && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {approvalMessage}
            </div>
          )}
        </div>

        {result && (
          <div className="mt-6 rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
                  Analysis Result
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Scam Alert Output
                </h2>
              </div>

              <div
                className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${riskClass(
                  result.riskLevel,
                )}`}
              >
                Risk: {result.riskLevel}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                  Summary
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-200">
                  {result.summary}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                  Recommended Action
                </p>
                <p className="mt-3 text-sm leading-6 text-zinc-200">
                  {result.recommendedAction}
                </p>
              </div>
            </div>

            {result.needsUserAttention && (
              <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200">
                This result needs user attention before any sensitive next
                action.
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                Red Flags
              </p>

              {result.redFlags.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-400">
                  No explicit red flags returned.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {result.redFlags.map((flag, index) => (
                    <li
                      key={`${flag}-${index}`}
                      className="rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-sm text-red-200"
                    >
                      {flag}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {showApprovalAction && (
              <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-red-300">
                  Approval Boundary
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-200">
                  This result is high risk. Any sensitive next action should go
                  through approval before continuing.
                </p>

                <button
                  onClick={handleRequestApproval}
                  disabled={approvalLoading}
                  className={`mt-4 rounded-xl px-5 py-3 text-sm font-semibold ${
                    approvalLoading
                      ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                      : "bg-red-500 text-white hover:opacity-90"
                  }`}
                >
                  {approvalLoading
                    ? "Requesting Approval..."
                    : "Request Approval to Continue"}
                </button>
              </div>
            )}

            {approvalId && (
              <div className="mt-4 rounded-2xl border border-[#a4f4d9]/20 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
                  Approval Result
                </p>

                <h3 className="mt-2 text-lg font-semibold text-white">
                  Approval boundary created
                </h3>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-zinc-500">Approval ID</p>
                    <p className="mt-1 break-all text-sm text-zinc-200">
                      {approvalId}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">Status</p>
                    <p className="mt-1 text-sm font-semibold text-yellow-300">
                      {approvalStatus}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">Action Type</p>
                    <p className="mt-1 text-sm text-zinc-200">
                      {approvalActionType}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-zinc-300">
                  Sensitive next action is now behind an approval boundary.
                </p>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-zinc-800 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                Meta
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <div>
                  <p className="text-xs text-zinc-500">Job ID</p>
                  <p className="mt-1 break-all text-sm text-zinc-200">
                    {result.jobId || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Output ID</p>
                  <p className="mt-1 break-all text-sm text-zinc-200">
                    {result.outputId || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Confidence</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    {result.confidence || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500">Provider</p>
                  <p className="mt-1 text-sm text-zinc-200">
                    {result.analysisProvider || "-"}
                  </p>
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-xs text-[#7ceee0]">
                  View raw content
                </summary>
                <pre className="mt-2 overflow-x-auto rounded-xl bg-black/30 p-3 text-xs text-zinc-300">
                  {JSON.stringify(result.rawContent, null, 2)}
                </pre>
              </details>
            </div>

            <ControlAssistantPanel
              userId={userId.trim()}
              sessionId={sessionId.trim()}
              scamAlertResult={result}
            />
            <AskBraviumCommunityPanel
              userId={userId.trim()}
              sessionId={sessionId.trim()}
              scamAlertResult={result}
            />
          </div>
        )}
      </div>
    </div>
  );
}
