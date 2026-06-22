import { createAssistantResponse } from "./assistantResponseContract";

function includesAny(text, keywords) {
  const raw = String(text || "").toLowerCase();
  return keywords.some((keyword) => raw.includes(keyword));
}

export function routeAssistantRequest(context) {
  const input = String(context?.input_text || "").toLowerCase();
  const currentPage = String(context?.current_page || "").toLowerCase();
  const currentFeature = String(context?.current_feature || "").toLowerCase();
  const latestAlerts = Array.isArray(context?.latest_alerts)
    ? context.latest_alerts
    : [];
  const financeContext = context?.finance_context || {};

  if (
    currentPage.includes("scam") ||
    currentFeature.includes("scam") ||
    latestAlerts.length > 0 ||
    includesAny(input, ["scam", "alert", "risk", "flag", "warning"])
  ) {
    return createAssistantResponse({
      mode: "scam_alert_shell",
      summary: "Scam Alert context detected.",
      answerText:
        "Ask Bravium is ready to explain the current risk result, the detected red flags, and the next recommended control step.",
      suggestedActions: [
        "Explain why this was flagged",
        "Show what needs approval",
        "Escalate this case to community",
      ],
      needsUserAttention: true,
      needsUserApproval: false,
      sourceContextUsed: [
        "ui_context",
        "risk_alert_context",
        "event_history_context",
      ],
      logsToEmit: ["ai_assistant_routed"],
    });
  }

  if (
    currentPage.includes("fixed-expenses") ||
    currentPage.includes("budget") ||
    currentFeature.includes("budget") ||
    includesAny(input, [
      "expense",
      "budget",
      "reminder",
      "due",
      "fixed expense",
    ])
  ) {
    return createAssistantResponse({
      mode: "budget_assistant_shell",
      summary: "Budget / fixed expenses context detected.",
      answerText:
        "Ask Bravium is ready to explain parsed expenses, saved obligations, upcoming reminders, and budget pressure signals.",
      suggestedActions: [
        "Explain saved fixed expenses",
        "Show upcoming obligations",
        "Explain latest budget alert",
      ],
      needsUserAttention: false,
      needsUserApproval: false,
      sourceContextUsed: [
        "ui_context",
        "finance_context",
        "event_history_context",
      ],
      logsToEmit: ["ai_assistant_routed"],
    });
  }

  if (
    currentPage.includes("capital-guard") ||
    currentFeature.includes("capital_guard") ||
    financeContext?.latestCapitalGuardResult ||
    includesAny(input, [
      "invest",
      "buy",
      "btc",
      "eth",
      "capital guard",
      "safe to invest",
    ])
  ) {
    return createAssistantResponse({
      mode: "capital_guard_shell",
      summary: "Capital Guard context detected.",
      answerText:
        "Ask Bravium is ready to explain the current pre-investment safety result, counted obligations, and the maximum safe amount.",
      suggestedActions: [
        "Why is this blocked?",
        "What is my max safe amount?",
        "Show obligations used in this check",
      ],
      needsUserAttention: true,
      needsUserApproval: false,
      sourceContextUsed: [
        "ui_context",
        "finance_context",
        "event_history_context",
      ],
      logsToEmit: ["ai_assistant_routed"],
    });
  }

  if (includesAny(input, ["wallet", "split", "allocation"])) {
    return createAssistantResponse({
      mode: "wallet_guidance_shell",
      summary: "Wallet guidance context detected.",
      answerText:
        "Wallet guidance shell is ready, but the guidance logic is not plugged in yet.",
      suggestedActions: [
        "Explain wallet split goals",
        "Show available session context",
      ],
      needsUserAttention: false,
      needsUserApproval: false,
      sourceContextUsed: ["ui_context"],
      logsToEmit: ["ai_assistant_routed"],
    });
  }

  if (includesAny(input, ["market", "price", "news", "move", "token"])) {
    return createAssistantResponse({
      mode: "market_alert_shell",
      summary: "Market alert context detected.",
      answerText:
        "Market alert shell is ready, but live market intelligence has not been plugged in yet.",
      suggestedActions: [
        "Explain market alert context",
        "Show which data sources are missing",
      ],
      needsUserAttention: false,
      needsUserApproval: false,
      sourceContextUsed: ["ui_context"],
      logsToEmit: ["ai_assistant_routed"],
    });
  }

  return createAssistantResponse({
    mode: "general_control_assistant",
    summary: "General control context detected.",
    answerText:
      "Ask Bravium is now running as a structured assistant shell. It can route your request using page context, session context, alerts, finance context, and recent events.",
    suggestedActions: [
      "Explain current session state",
      "Show latest alerts",
      "Show what needs attention",
    ],
    needsUserAttention: false,
    needsUserApproval: false,
    sourceContextUsed: [
      "ui_context",
      "session_context",
      "event_history_context",
    ],
    logsToEmit: ["ai_assistant_routed"],
  });
}
