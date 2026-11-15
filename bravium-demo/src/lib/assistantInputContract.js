
export const ASSISTANT_INPUT_SOURCE = Object.freeze({
  TEXT: "text",
  VOICE: "voice",
});

export function normalizeAssistantText(value) {
  if (typeof value !== "string") return "";

  return value
    .normalize("NFC")
    .replace(/\s+/gu, " ")
    .trim();
}

export function createUnifiedAssistantInput({
  text,
  inputSource = ASSISTANT_INPUT_SOURCE.TEXT,
  currentPage = "",
  currentFeature = "",
  sessionId = "",
  recentEvents = [],
  latestAlerts = [],
  financeContext = {},
  userState = {},
} = {}) {
  const inputText = normalizeAssistantText(text);

  if (!inputText) return null;

  if (
    !Object.values(ASSISTANT_INPUT_SOURCE).includes(inputSource)
  ) {
    throw new Error("Unsupported assistant input source");
  }

  return {
    original_text: text,
    input_text: inputText,
    input_source: inputSource,
    current_page: currentPage || "",
    current_feature: currentFeature || "",
    session_id: sessionId || "",
    recent_events: Array.isArray(recentEvents)
      ? recentEvents.slice(0, 20)
      : [],
    latest_alerts: Array.isArray(latestAlerts)
      ? latestAlerts.slice(0, 5)
      : [],
    finance_context:
      financeContext && typeof financeContext === "object"
        ? financeContext
        : {},
    optional_user_state:
      userState && typeof userState === "object"
        ? userState
        : {},
  };
}

export function assistantInputLogMetadata(request) {
  return {
    input_source: request.input_source,
    current_page: request.current_page,
    current_feature: request.current_feature,
    session_id: request.session_id,
    text_length: request.input_text.length,
    raw_text_logged: false,
  };
}
