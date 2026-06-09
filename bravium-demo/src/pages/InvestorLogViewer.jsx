import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchInvestorLogs } from "../lib/investorLogApi";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatType(type) {
  if (!type) return "unknown_event";
  return type.replaceAll("_", " ");
}

function getSourceLabel(event) {
  const type = String(event?.type || "");
  const source = String(event?.source || "");

  if (type.startsWith("physical_confirm_")) return "physical_button";
  if (type.startsWith("ai_") || source.startsWith("ai.")) return "ai";
  if (
    type === "user_approved" ||
    type === "user_rejected" ||
    type === "user_approval_requested"
  ) {
    return "user";
  }
  return "system";
}

function getStatusLabel(event) {
  const type = String(event?.type || "");

  if (type.endsWith("_requested") || type.endsWith("_started")) {
    return "pending";
  }

  if (
    type.endsWith("_failed") ||
    type.endsWith("_blocked") ||
    type === "user_rejected" ||
    type === "action_blocked"
  ) {
    return "blocked";
  }

  if (
    type.endsWith("_completed") ||
    type.endsWith("_generated") ||
    type.endsWith("_received") ||
    type.endsWith("_executed") ||
    type.endsWith("_approved") ||
    type.endsWith("_saved") ||
    type.endsWith("_scheduled") ||
    type.endsWith("_confirmed")
  ) {
    return "success";
  }

  return "info";
}

function statusClass(status) {
  if (status === "success")
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20";
  if (status === "blocked")
    return "bg-red-500/15 text-red-300 border border-red-500/20";
  if (status === "pending")
    return "bg-yellow-500/15 text-yellow-300 border border-yellow-500/20";
  return "bg-zinc-500/15 text-zinc-300 border border-zinc-500/20";
}

function sourceClass(source) {
  if (source === "ai") return "bg-cyan-500/15 text-cyan-300";
  if (source === "user") return "bg-purple-500/15 text-purple-300";
  if (source === "physical_button") return "bg-orange-500/15 text-orange-300";
  return "bg-zinc-500/15 text-zinc-300";
}

function summarizePayload(payload) {
  if (!payload || typeof payload !== "object") return "-";

  const known =
    payload.summary ||
    payload.recommendation ||
    payload.reply ||
    payload.actionType ||
    payload.message ||
    payload.reason ||
    payload.riskLevel;

  if (known) return String(known);

  const keys = Object.keys(payload);
  if (keys.length === 0) return "-";

  const compact = keys.slice(0, 3).reduce((acc, key) => {
    acc[key] = payload[key];
    return acc;
  }, {});

  return JSON.stringify(compact);
}

function summarizeFinanceEvent(event) {
  const payload =
    event?.payload && typeof event.payload === "object" ? event.payload : {};

  switch (event?.type) {
    case "expense_parsed":
      return `Parsed ${payload.candidateCount ?? 0} fixed expense candidate(s) from ${payload.inputLineCount ?? 0} input line(s).`;

    case "expense_saved":
      return `Saved fixed expense: ${payload.label || "unknown"} · ${payload.amount ?? "-"} ${payload.currency || ""} · day ${payload.dueDay ?? "-"}.`;

    case "reminder_scheduled":
      return `Scheduled reminder for ${payload.label || "fixed expense"}${payload.scheduledFor ? ` at ${new Date(payload.scheduledFor).toLocaleString()}` : ""}.`;

    case "budget_alert_generated":
      return `Budget alert generated: projected fixed expense ${payload.projectedFixedExpense ?? "-"} ${payload.budgetCurrency || ""} against budget ${payload.budget ?? "-"}.`;

    default:
      return null;
  }
}

const CATEGORY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "checkpoint", label: "Checkpoint" },
  { value: "ai", label: "AI" },
  { value: "control", label: "Control" },
  { value: "finance", label: "Finance" },
  { value: "device", label: "Device" },
  { value: "unknown", label: "Unknown" },
];

const SOURCE_OPTIONS = [
  { value: "all", label: "All sources" },
  { value: "ai", label: "AI" },
  { value: "user", label: "User" },
  { value: "physical_button", label: "Physical" },
  { value: "system", label: "System" },
];

export default function InvestorLogViewer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sourceFilter, setSourceFilter] = useState("all");

  const [userIdInput, setUserIdInput] = useState(
    searchParams.get("userId") || "",
  );
  const [sessionIdInput, setSessionIdInput] = useState(
    searchParams.get("sessionId") || "",
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const userId = searchParams.get("userId") || "";
  const sessionId = searchParams.get("sessionId") || "";

  async function loadLogs(nextUserId = userId, nextSessionId = sessionId) {
    if (!nextUserId) return;

    setLoading(true);
    setError("");

    try {
      const result = await fetchInvestorLogs({
        userId: nextUserId,
        sessionId: nextSessionId || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      void loadLogs(userId, sessionId);
    }
  }, [userId, sessionId]);

  const events = data?.events || [];
  const sessions = data?.sessions || [];
  const approvals = data?.approvals || [];
  const aiJobs = data?.aiJobs || [];
  const summary = data?.summary || {};

  const aiInsights = useMemo(() => {
    return aiJobs.flatMap((job) =>
      (job.outputs || []).map((output) => ({
        jobId: job.id,
        jobType: job.type,
        status: job.status,
        outputType: output.outputType,
        createdAt: output.createdAt,
        content: output.content,
      })),
    );
  }, [aiJobs]);

  const controlSummary = useMemo(() => {
    const approved = approvals.filter(
      (item) => item.status === "APPROVED",
    ).length;
    const rejected = approvals.filter(
      (item) => item.status === "REJECTED",
    ).length;
    const requested = approvals.filter(
      (item) => item.status === "REQUESTED",
    ).length;
    const blocked = events.filter(
      (item) => item.type === "action_blocked",
    ).length;
    const executed = events.filter(
      (item) => item.type === "action_executed",
    ).length;

    return { approved, rejected, requested, blocked, executed };
  }, [approvals, events]);

  const financeSummary = useMemo(() => {
    const parsed = events.filter(
      (item) => item.type === "expense_parsed",
    ).length;
    const saved = events.filter((item) => item.type === "expense_saved").length;
    const reminders = events.filter(
      (item) => item.type === "reminder_scheduled",
    ).length;
    const budgetAlerts = events.filter(
      (item) => item.type === "budget_alert_generated",
    ).length;

    const latestBudgetAlert = events.find(
      (item) => item.type === "budget_alert_generated",
    );

    const latestBudgetPayload =
      latestBudgetAlert?.payload &&
      typeof latestBudgetAlert.payload === "object"
        ? latestBudgetAlert.payload
        : null;

    return {
      parsed,
      saved,
      reminders,
      budgetAlerts,
      latestBudgetPayload,
    };
  }, [events]);

  const timeline = useMemo(() => {
    return events.map((event) => {
      const sourceLabel = getSourceLabel(event);
      const statusLabel = getStatusLabel(event);
      const financeSummary =
        event.category === "finance" ? summarizeFinanceEvent(event) : null;

      return {
        ...event,
        sourceLabel,
        statusLabel,
        summaryText: financeSummary || summarizePayload(event.payload),
      };
    });
  }, [events]);

  const filteredTimeline = useMemo(() => {
    return timeline.filter((item) => {
      const category = item.category || "unknown";
      const source = item.sourceLabel || "system";

      const categoryMatch =
        categoryFilter === "all" ? true : category === categoryFilter;

      const sourceMatch =
        sourceFilter === "all" ? true : source === sourceFilter;

      return categoryMatch && sourceMatch;
    });
  }, [timeline, categoryFilter, sourceFilter]);

  const activeSession = sessions[0] || null;

  const handleApply = () => {
    const next = new URLSearchParams();

    if (userIdInput.trim()) next.set("userId", userIdInput.trim());
    if (sessionIdInput.trim()) next.set("sessionId", sessionIdInput.trim());

    setCategoryFilter("all");
    setSourceFilter("all");
    setSearchParams(next);
  };

  return (
    <div className="min-h-screen bg-[#06110f] text-white px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-[#7ceee0]">
            Bravium Investor View
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Investor Log Viewer</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Read from real event source. No mock timeline.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr,1fr,auto,auto]">
            <input
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              placeholder="userId"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none"
            />
            <input
              value={sessionIdInput}
              onChange={(e) => setSessionIdInput(e.target.value)}
              placeholder="sessionId (optional)"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none"
            />
            <button
              onClick={handleApply}
              className="rounded-xl bg-[#a4f4d9] px-5 py-3 text-sm font-semibold text-black"
            >
              Load Logs
            </button>
            <button
              onClick={() => void loadLogs(userId, sessionId)}
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-medium text-zinc-200"
            >
              Reload
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Session ID
            </p>
            <p className="mt-2 break-all text-sm text-white">
              {activeSession?.id || sessionId || "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Events
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {summary.eventCount || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              AI Jobs
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {summary.aiJobCount || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Approvals
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {summary.approvalCount || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              Latest Event
            </p>
            <p className="mt-2 text-sm text-white">
              {formatDate(summary.latestEventAt)}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
              AI saw / AI suggested
            </p>

            <div className="mt-4 space-y-3">
              {aiInsights.length === 0 ? (
                <div className="rounded-xl border border-zinc-800 bg-black/20 p-4 text-sm text-zinc-400">
                  No AI output found for this query.
                </div>
              ) : (
                aiInsights.slice(0, 6).map((item) => {
                  const content = item.content || {};
                  return (
                    <div
                      key={`${item.jobId}-${item.outputType}-${item.createdAt}`}
                      className="rounded-xl border border-zinc-800 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">
                          {item.outputType}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>

                      <p className="mt-2 text-xs text-zinc-400">
                        job: {item.jobType} · status: {item.status}
                      </p>

                      {"riskLevel" in content && (
                        <p className="mt-3 text-sm text-orange-300">
                          Risk: {String(content.riskLevel)}
                        </p>
                      )}

                      {"summary" in content && (
                        <p className="mt-2 text-sm text-zinc-200">
                          {String(content.summary)}
                        </p>
                      )}

                      {"recommendation" in content && (
                        <p className="mt-2 text-sm text-cyan-300">
                          {String(content.recommendation)}
                        </p>
                      )}

                      {"reply" in content && (
                        <p className="mt-2 text-sm text-zinc-200 line-clamp-4">
                          {String(content.reply)}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
              User control / approvals
            </p>

            <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
                Finance / fixed expenses
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-black/20 p-4">
                  <p className="text-xs text-zinc-400">Parsed</p>
                  <p className="mt-2 text-xl font-semibold">
                    {financeSummary.parsed}
                  </p>
                </div>
                <div className="rounded-xl bg-black/20 p-4">
                  <p className="text-xs text-zinc-400">Saved</p>
                  <p className="mt-2 text-xl font-semibold text-cyan-300">
                    {financeSummary.saved}
                  </p>
                </div>
                <div className="rounded-xl bg-black/20 p-4">
                  <p className="text-xs text-zinc-400">Reminders</p>
                  <p className="mt-2 text-xl font-semibold text-yellow-300">
                    {financeSummary.reminders}
                  </p>
                </div>
                <div className="rounded-xl bg-black/20 p-4">
                  <p className="text-xs text-zinc-400">Budget Alerts</p>
                  <p className="mt-2 text-xl font-semibold text-red-300">
                    {financeSummary.budgetAlerts}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-zinc-800 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Latest budget context
                </p>

                {financeSummary.latestBudgetPayload ? (
                  <div className="mt-3 space-y-2 text-sm text-zinc-200">
                    <p>
                      projected fixed expense:{" "}
                      {financeSummary.latestBudgetPayload
                        .projectedFixedExpense ?? "-"}{" "}
                      {financeSummary.latestBudgetPayload.budgetCurrency || ""}
                    </p>
                    <p>
                      budget: {financeSummary.latestBudgetPayload.budget ?? "-"}{" "}
                      {financeSummary.latestBudgetPayload.budgetCurrency || ""}
                    </p>
                    <p>
                      usage ratio:{" "}
                      {typeof financeSummary.latestBudgetPayload.usageRatio ===
                      "number"
                        ? `${(financeSummary.latestBudgetPayload.usageRatio * 100).toFixed(1)}%`
                        : "-"}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-zinc-400">
                    No budget alert found in the current query.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-black/20 p-4">
                <p className="text-xs text-zinc-400">Requested</p>
                <p className="mt-2 text-xl font-semibold">
                  {controlSummary.requested}
                </p>
              </div>
              <div className="rounded-xl bg-black/20 p-4">
                <p className="text-xs text-zinc-400">Approved</p>
                <p className="mt-2 text-xl font-semibold text-emerald-300">
                  {controlSummary.approved}
                </p>
              </div>
              <div className="rounded-xl bg-black/20 p-4">
                <p className="text-xs text-zinc-400">Rejected</p>
                <p className="mt-2 text-xl font-semibold text-red-300">
                  {controlSummary.rejected}
                </p>
              </div>
              <div className="rounded-xl bg-black/20 p-4">
                <p className="text-xs text-zinc-400">Blocked / Executed</p>
                <p className="mt-2 text-sm text-zinc-200">
                  {controlSummary.blocked} blocked · {controlSummary.executed}{" "}
                  executed
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {approvals.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-zinc-800 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">
                      {item.actionType}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        item.status === "APPROVED"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : item.status === "REJECTED"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-yellow-500/15 text-yellow-300"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-400">
                    created: {formatDate(item.createdAt)}
                  </p>

                  {item.decidedAt && (
                    <p className="mt-1 text-xs text-zinc-400">
                      decided: {formatDate(item.decidedAt)}
                    </p>
                  )}

                  {item.decisionReason && (
                    <p className="mt-2 text-sm text-zinc-200">
                      {item.decisionReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-5">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
                  Timeline
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  Real event timeline
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  newest first · showing {filteredTimeline.length} of{" "}
                  {timeline.length} events
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                Filter by category
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((option) => {
                  const active = categoryFilter === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => setCategoryFilter(option.value)}
                      className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                        active
                          ? "bg-[#a4f4d9] text-black"
                          : "border border-zinc-700 bg-black/20 text-zinc-300 hover:bg-white/5"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
                Filter by source
              </p>
              <div className="flex flex-wrap gap-2">
                {SOURCE_OPTIONS.map((option) => {
                  const active = sourceFilter === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => setSourceFilter(option.value)}
                      className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                        active
                          ? "bg-cyan-400 text-black"
                          : "border border-zinc-700 bg-black/20 text-zinc-300 hover:bg-white/5"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-xl border border-zinc-800 bg-black/20 p-4 text-sm text-zinc-400">
                Loading investor logs...
              </div>
            ) : filteredTimeline.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-black/20 p-4 text-sm text-zinc-400">
                No events found for category:{" "}
                <span className="text-white">{categoryFilter}</span>
              </div>
            ) : (
              filteredTimeline.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-zinc-800 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${sourceClass(item.sourceLabel)}`}
                    >
                      {item.sourceLabel}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs ${statusClass(item.statusLabel)}`}
                    >
                      {item.statusLabel}
                    </span>

                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                      {item.category || "uncategorized"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {formatType(item.type)}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-300">
                        {item.summaryText}
                      </p>
                    </div>

                    <div className="text-xs text-zinc-500">
                      <p>{formatDate(item.createdAt)}</p>
                      <p className="mt-1 break-all">
                        session: {item.sessionId || "-"}
                      </p>
                    </div>
                  </div>

                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-[#7ceee0]">
                      View payload
                    </summary>
                    <pre className="mt-2 overflow-x-auto rounded-xl bg-black/30 p-3 text-xs text-zinc-300">
                      {JSON.stringify(item.payload || {}, null, 2)}
                    </pre>
                  </details>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
