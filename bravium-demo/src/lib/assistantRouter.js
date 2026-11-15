import { createAssistantResponse } from "./assistantResponseContract.js";

function includesAny(text, keywords) {
  const raw = String(text || "").toLowerCase();
  return keywords.some((keyword) => raw.includes(keyword));
}

// Matching only: the original transcript remains unchanged for the target module.
function foldText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();
}

const MODULES = Object.freeze({
  general_chat: "general_control_assistant",
  scam_alert: "scam_alert",
  capital_guard: "capital_guard",
  fixed_expenses: "fixed_expenses",
  market_alert: "market_alert",
  camera_capture: "camera_capture",
  memory_search: "memory_search",
  reminder_create: "reminder_create",
  flower_assistant: "flower_assistant",
  unknown: null,
});

// These modules are not wired up in P03.2. Do not present them as executed.
const UNAVAILABLE = new Set([
  "market_alert",
  "camera_capture",
  "memory_search",
  "reminder_create",
  "flower_assistant",
]);

const NEEDS_CONFIRMATION = new Set([
  "camera_capture",
  "reminder_create",
  "flower_assistant",
]);

export function classifyAssistantIntent(context = {}) {
  const originalText = String(context?.original_text ?? context?.input_text ?? "");
  const input = foldText(originalText);
  const page = foldText(context?.current_page);
  const feature = foldText(context?.current_feature);
  const asksForExplanation = /\b(why|explain|show|what|how|tai sao|giai thich|cho xem|vi sao)\b/.test(input);

  let intent = "unknown";

  // Safety words win over other commands. P03.3 must still call Scam Alert's hard rule.
  if (/\b(seed phrase|recovery phrase|private key|scam|rug pull|fraud|red flags?|lua dao|ma khoa rieng|cum tu khoi phuc|suspicious (project|contract)|connect wallet)\b/.test(input)) {
    intent = "scam_alert";
  } else if (/\b(nhac (toi|minh|nho)|dat lich nhac|hen gio nhac|remind me|set a reminder|schedule a reminder)\b/.test(input)) {
    intent = "reminder_create";
  } else if (/\b(chup (anh|hinh)|take (a |the )?(photo|picture)|capture (a |the )?(photo|picture)|open (the )?camera)\b/.test(input)) {
    intent = "camera_capture";
  } else if (/\b((dat|mua|gui|tang) hoa|order flowers?|send flowers?|flower delivery|flower assistant)\b/.test(input)) {
    intent = "flower_assistant";
  } else if (/\b(tim (lai )?(anh|hinh|ky niem)|tim ky niem|memories|memory search|find (me )?(my )?(old )?photos?|search (my )?photos?|show (me )?(my )?(old )?photos?)\b/.test(input)) {
    intent = "memory_search";
  } else if (
    /\b(market|market alerts?|price alerts?|gia (btc|eth|etc|bitcoin|ethereum)|price (of |for )?(btc|eth|etc|bitcoin|ethereum))\b/.test(input) ||
    (/\b(alert|notify|canh bao|bao toi)\b/.test(input) && /\b(price|market|gia|btc|eth|etc)\b/.test(input)) ||
    (/\b(btc|eth|etc|bitcoin|ethereum)\b/.test(input) && (/\b(tang|giam|rises?|drops?|moves?|changes?)\b/.test(input) || /[+-]\s*15\s*%/.test(input)))
  ) {
    intent = "market_alert";
  } else if (
    /\b(capital guard|safe to invest|max safe amount|co nen (mua|dau tu))\b/.test(input) ||
    (/\b(buy|invest|purchase|put|mua|dau tu)\b/.test(input) && /\b(btc|eth|etc|bitcoin|ethereum|crypto|usdt|usd|do|\d+)\b/.test(input))
  ) {
    intent = "capital_guard";
  } else if (
    /\b(fixed expenses?|chi phi co dinh|tien nha|tien hoc|hoc phi|netflix|rent|tuition|school fee|monthly bills?|monthly expenses?|budget|chi tieu|chi phi)\b/.test(input) ||
    /\b\d+(?:[.,]\d+)?\s*(?:usdt|usd|do)\b.*\bngay\s*\d{1,2}\b/.test(input)
  ) {
    intent = "fixed_expenses";
  } else if (asksForExplanation && (page.includes("scam") || feature.includes("scam")) && /\b(flag|warning|risk|alert|this|it|canh bao|rui ro)\b/.test(input)) {
    intent = "scam_alert";
  } else if (asksForExplanation && (page.includes("capital-guard") || feature.includes("capital_guard")) && /\b(block|blocked|safe|amount|limit|chan|gioi han)\b/.test(input)) {
    intent = "capital_guard";
  } else if (asksForExplanation && (page.includes("fixed-expenses") || feature.includes("budget")) && /\b(bills?|expenses?|payment|obligations?|khoan|chi|tra)\b/.test(input)) {
    intent = "fixed_expenses";
  } else if (
    /\b(hello|hi|hey|xin chao|chao bravium|thanks|thank you|cam on|what|why|how|who|tell me|help me|can you|tai sao|giai thich|giup toi|bravium la ai|session|wallet|split|allocation)\b/.test(input)
  ) {
    intent = "general_chat";
  }

  const entities = {};
  if (intent === "camera_capture") {
    // Keep the event exactly as spoken; never infer the child's gender.
    const secondSentence = originalText.match(/[.!?]\s*(.+)$/s);
    if (secondSentence?.[1]) entities.event_context = secondSentence[1].trim();
  }
  if (intent === "reminder_create") {
    // P05 will resolve the time; P03.2 must not fabricate a timestamp.
    entities.time_context = originalText.trim();
  }

  return {
    intent,
    original_text: originalText,
    input_source: /voice|microphone/i.test(context?.input_source || "") ? "voice" : "text",
    entities,
    target_module: MODULES[intent],
    routing_status: intent === "unknown" ? "unrecognized" : UNAVAILABLE.has(intent) ? "unavailable" : "ready_for_dispatch",
    requires_confirmation: NEEDS_CONFIRMATION.has(intent),
    session_id: String(context?.session_id || ""),
  };
}

export function routeAssistantRequest(context) {
  const routing = classifyAssistantIntent(context);
  // Preserve all legacy shell fields and add the P03 routing contract.
  return { ...routeAssistantShell(context, routing), ...routing };
}

function routeAssistantShell(context, routing) {
  const input = String(context?.input_text || "").toLowerCase();

  if (routing.intent === "scam_alert") {
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

  if (routing.intent === "fixed_expenses") {
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

  if (routing.intent === "capital_guard") {
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

  // Keep the previous wallet guidance shell for backward compatibility.
  // It remains a sub-mode of general_chat, not an eleventh P03 intent.
  if (routing.intent === "general_chat" && includesAny(input, ["wallet", "split", "allocation"])) {
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

  if (routing.intent === "market_alert") {
    return createAssistantResponse({
      mode: "market_alert_shell",
      summary: "Market alert context detected.",
      answerText:
        "Market Alert is not available yet. No live price monitoring or alert has started.",
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

  const unavailableResponses = {
    camera_capture: ["Camera capture is not available yet. No photo has been taken.", "camera_capture_shell"],
    memory_search: ["Memory search is not available yet. No memories have been searched.", "memory_search_shell"],
    reminder_create: ["Reminder creation is not available yet. No reminder has been scheduled.", "reminder_create_shell"],
    flower_assistant: ["Flower ordering is not available yet. No order or payment was made.", "flower_assistant_shell"],
  };
  if (unavailableResponses[routing.intent]) {
    const [answerText, mode] = unavailableResponses[routing.intent];
    return createAssistantResponse({
      mode,
      summary: `${routing.intent} recognized; module unavailable.`,
      answerText,
      suggestedActions: ["Try another available feature"],
      needsUserAttention: true,
      // No approval is pending while the capability itself is unavailable.
      needsUserApproval: false,
      sourceContextUsed: ["ui_context", "session_context"],
      logsToEmit: ["ai_assistant_routed"],
    });
  }

  if (routing.intent === "unknown") {
    return createAssistantResponse({
      mode: "unknown_command_shell",
      summary: "Command not recognized.",
      answerText: "I could not identify that request. Please rephrase or choose a feature.",
      suggestedActions: ["Try Scam Alert", "Check Capital Guard", "Review Fixed Expenses"],
      needsUserAttention: true,
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
