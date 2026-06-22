function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function buildAssistantContext({
  inputText,
  inputSource = "ask_bravium_floating_button",
  currentPage = "",
  currentFeature = "",
  sessionId = "",
  recentEvents = [],
  latestAlerts = [],
  financeContext = {},
  userState = {},
}) {
  return {
    input_text: inputText || "",
    input_source: inputSource,
    current_page: currentPage || "",
    current_feature: currentFeature || "",
    session_id: sessionId || "",
    recent_events: safeArray(recentEvents).slice(0, 20),
    latest_alerts: safeArray(latestAlerts).slice(0, 5),
    finance_context: {
      fixed_expense_summary: financeContext?.fixedExpenseSummary || null,
      latest_budget_alert: financeContext?.latestBudgetAlert || null,
      latest_capital_guard_result: financeContext?.latestCapitalGuardResult || null,
    },
    optional_user_state: userState || {},
  };
}