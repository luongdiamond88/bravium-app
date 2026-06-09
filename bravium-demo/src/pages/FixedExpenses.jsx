import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  parseFixedExpenses,
  runBudgetChecks,
  saveFixedExpenses,
} from "../lib/fixedExpensesApi";

function isCandidateSavable(item) {
  return (
    typeof item?.label === "string" &&
    item.label.trim().length > 0 &&
    typeof item?.amount === "number" &&
    !Number.isNaN(item.amount) &&
    typeof item?.currency === "string" &&
    item.currency.trim().length > 0 &&
    typeof item?.dueDay === "number" &&
    item.dueDay >= 1 &&
    item.dueDay <= 31
  );
}

export default function FixedExpenses() {
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get("userId") || "";
  const querySessionId = searchParams.get("sessionId") || "";

  const [userId, setUserId] = useState(queryUserId || "user_demo_1");
  const [sessionId, setSessionId] = useState(querySessionId);
  const [text, setText] = useState(
    "Rent is 300 USD on day 1\n" +
      "The child's tuition fee is 200 USD on the 5th\n" +
      "Netflix 39 USD on the 15th",
  );
  const [monthlyBudget, setMonthlyBudget] = useState("1000");
  const [budgetCurrency, setBudgetCurrency] = useState("USDT");

  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);

  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [checkMessage, setCheckMessage] = useState("");

  const [result, setResult] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [checkResult, setCheckResult] = useState(null);

  useEffect(() => {
    if (queryUserId) {
      setUserId(queryUserId);
    }

    if (querySessionId) {
      setSessionId(querySessionId);
    }
  }, [queryUserId, querySessionId]);

  async function handleParse() {
    if (!userId.trim()) {
      setError("Missing userId");
      return;
    }

    if (!text.trim()) {
      setError("Please enter at least one expense line.");
      return;
    }

    setLoading(true);
    setError("");
    setSaveMessage("");
    setCheckMessage("");
    setCheckResult(null);
    setSavedItems([]);

    try {
      const response = await parseFixedExpenses({
        userId: userId.trim(),
        sessionId: sessionId.trim(),
        text: text.trim(),
      });

      setResult(response);
      setSelectedIds(
        (response?.candidates || [])
          .filter((item) => isCandidateSavable(item))
          .map((item) => item.tempId),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse failed");
      setResult(null);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleCandidate(tempId) {
    setSelectedIds((prev) =>
      prev.includes(tempId)
        ? prev.filter((id) => id !== tempId)
        : [...prev, tempId],
    );
  }

  async function handleSaveSelected() {
    if (!result?.candidates?.length) {
      setError("No parsed candidates to save.");
      return;
    }

    const selectedCandidates = result.candidates.filter(
      (item) => selectedIds.includes(item.tempId) && isCandidateSavable(item),
    );

    if (selectedCandidates.length === 0) {
      setError("No valid selected candidates to save.");
      return;
    }

    setSaveLoading(true);
    setError("");
    setSaveMessage("");
    setCheckMessage("");
    setCheckResult(null);

    try {
      const response = await saveFixedExpenses({
        userId: userId.trim(),
        sessionId: sessionId.trim(),
        candidates: selectedCandidates.map((item) => ({
          label: item.label,
          amount: item.amount,
          currency: item.currency,
          dueDay: item.dueDay,
          recurrence: item.recurrence,
          category: item.category,
          sourceText: item.sourceText,
        })),
      });

      setSavedItems(response.savedExpenses || []);
      setSaveMessage(
        `Saved ${response.savedCount || 0} fixed expense(s) successfully.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSavedItems([]);
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleRunChecks() {
    if (!userId.trim()) {
      setError("Missing userId");
      return;
    }

    setCheckLoading(true);
    setError("");
    setCheckMessage("");

    try {
      const response = await runBudgetChecks({
        userId: userId.trim(),
        sessionId: sessionId.trim(),
        monthlyBudget:
          monthlyBudget.trim().length > 0 ? Number(monthlyBudget) : undefined,
        budgetCurrency: budgetCurrency.trim() || undefined,
      });

      setCheckResult(response);
      setCheckMessage("Reminder + budget check completed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Budget check failed");
      setCheckResult(null);
    } finally {
      setCheckLoading(false);
    }
  }

  const candidates = result?.candidates || [];
  const warnings = result?.warnings || [];

  const selectedValidCount = useMemo(() => {
    return candidates.filter(
      (item) => selectedIds.includes(item.tempId) && isCandidateSavable(item),
    ).length;
  }, [candidates, selectedIds]);

  return (
    <div className="min-h-screen bg-[#071210] px-6 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#7ceee0]">
            Bravium Finance Layer
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Fixed Expenses</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Layer 8A + 8B + 8C: parse natural language, review, save fixed
            expenses, then run reminder + budget check for demo.
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
              Natural language input
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-4 text-sm outline-none"
              placeholder="Rent is 300 USD on day 1"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleParse}
              disabled={loading}
              className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                loading
                  ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                  : "bg-[#a4f4d9] text-black hover:opacity-90"
              }`}
            >
              {loading ? "Parsing..." : "Parse Expenses"}
            </button>

            <button
              onClick={handleSaveSelected}
              disabled={saveLoading || selectedValidCount === 0}
              className={`rounded-xl px-5 py-3 text-sm font-semibold ${
                saveLoading || selectedValidCount === 0
                  ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                  : "bg-cyan-400 text-black hover:opacity-90"
              }`}
            >
              {saveLoading
                ? "Saving..."
                : `Save Selected (${selectedValidCount})`}
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-[#a4f4d9]/20 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
              Layer 8C demo trigger
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
                  Monthly Budget
                </label>
                <input
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">
                  Budget Currency
                </label>
                <input
                  value={budgetCurrency}
                  onChange={(e) => setBudgetCurrency(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm outline-none"
                  placeholder="USDT"
                />
              </div>
            </div>

            <button
              onClick={handleRunChecks}
              disabled={checkLoading}
              className={`mt-4 rounded-xl px-5 py-3 text-sm font-semibold ${
                checkLoading
                  ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                  : "bg-yellow-300 text-black hover:opacity-90"
              }`}
            >
              {checkLoading
                ? "Running checks..."
                : "Run Reminder + Budget Check"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {saveMessage && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {saveMessage}
            </div>
          )}

          {checkMessage && (
            <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
              {checkMessage}
            </div>
          )}
        </div>

        {result && (
          <div className="mt-6 rounded-2xl border border-[#a4f4d9]/20 bg-black/30 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
                  Review candidates
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Confirm what should be saved
                </h2>
              </div>

              <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300">
                {result.candidateCount || 0} candidate(s)
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                <p className="text-xs text-zinc-500">Input lines</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {result.inputLineCount || 0}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                <p className="text-xs text-zinc-500">Candidates</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {result.candidateCount || 0}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                <p className="text-xs text-zinc-500">Ready to save</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {selectedValidCount}
                </p>
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                  Parse warnings
                </p>
                <ul className="mt-3 space-y-2">
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

            <div className="mt-4 space-y-4">
              {candidates.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-black/20 p-4 text-sm text-zinc-400">
                  No structured candidates were detected.
                </div>
              ) : (
                candidates.map((item) => {
                  const savable = isCandidateSavable(item);
                  const selected = selectedIds.includes(item.tempId);

                  return (
                    <div
                      key={item.tempId}
                      className="rounded-2xl border border-zinc-800 bg-black/20 p-4"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={!savable}
                            onChange={() => toggleCandidate(item.tempId)}
                            className="mt-1 h-4 w-4"
                          />
                          <div>
                            <p className="text-lg font-semibold text-white">
                              {item.label || "Untitled expense"}
                            </p>
                            <p className="mt-1 text-sm text-zinc-400">
                              {item.sourceText}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300">
                            confidence: {item.confidence}
                          </div>

                          <div
                            className={`rounded-full px-4 py-2 text-xs font-semibold ${
                              savable
                                ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
                                : "border border-red-500/20 bg-red-500/10 text-red-300"
                            }`}
                          >
                            {savable ? "ready to save" : "needs review"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-5">
                        <div>
                          <p className="text-xs text-zinc-500">Amount</p>
                          <p className="mt-1 text-sm text-zinc-200">
                            {item.amount ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Currency</p>
                          <p className="mt-1 text-sm text-zinc-200">
                            {item.currency || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Due day</p>
                          <p className="mt-1 text-sm text-zinc-200">
                            {item.dueDay ?? "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Recurrence</p>
                          <p className="mt-1 text-sm text-zinc-200">
                            {item.recurrence || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Category</p>
                          <p className="mt-1 text-sm text-zinc-200">
                            {item.category || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {savedItems.length > 0 && (
              <div className="mt-5 rounded-2xl border border-[#a4f4d9]/20 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
                  Saved fixed expenses
                </p>

                <div className="mt-3 space-y-3">
                  {savedItems.map((item) => (
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
                            id: {item.id}
                          </p>
                        </div>

                        <div className="text-sm text-zinc-200">
                          {item.amount} {item.currency} · day {item.dueDay}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {checkResult && (
              <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-yellow-300">
                  Reminder + budget check result
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                    <p className="text-xs text-zinc-500">Active expenses</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {checkResult.activeExpenseCount || 0}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                    <p className="text-xs text-zinc-500">Reminders</p>
                    <p className="mt-2 text-xl font-semibold text-white">
                      {checkResult.reminderCount || 0}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                    <p className="text-xs text-zinc-500">
                      Projected fixed expense
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {checkResult.projectedFixedExpense || 0}{" "}
                      {checkResult.budgetCurrency || ""}
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                    <p className="text-xs text-zinc-500">Budget usage</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {typeof checkResult.budgetUsageRatio === "number"
                        ? `${(checkResult.budgetUsageRatio * 100).toFixed(1)}%`
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold text-white">Reminders</p>
                  {checkResult.reminders?.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {checkResult.reminders.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-zinc-800 bg-black/20 px-4 py-3"
                        >
                          <p className="text-sm font-semibold text-white">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-zinc-300">
                            {item.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-400">
                      No reminders created in this run.
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold text-white">
                    Budget alert
                  </p>
                  {checkResult.budgetAlert ? (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                      <p className="text-sm font-semibold text-red-200">
                        {checkResult.budgetAlert.title}
                      </p>
                      <p className="mt-1 text-sm text-zinc-200">
                        {checkResult.budgetAlert.body}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-400">
                      No budget alert created in this run.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-[#a4f4d9]/20 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
                Demo note
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                Layer 8C is a manual demo trigger for now. It scans saved fixed
                expenses, creates reminders for upcoming due dates, and creates
                a basic budget alert when projected fixed expenses approach or
                exceed the budget.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
