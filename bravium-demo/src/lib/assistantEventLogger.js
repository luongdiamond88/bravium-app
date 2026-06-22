export function logAssistantEvent(logFn, type, payload = {}) {
  if (typeof logFn === "function") {
    logFn({
      type,
      source: "ai.assistant.shell",
      payload,
    });
    return;
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("bravium-assistant-log", {
        detail: {
          type,
          source: "ai.assistant.shell",
          payload,
        },
      }),
    );
  }
}
