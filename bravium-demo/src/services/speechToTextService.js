export function getSpeechRecognitionSupport() {
  if (typeof window === "undefined") {
    return {
      supported: false,
      reason: "Browser environment unavailable.",
    };
  }

  if (!window.isSecureContext) {
    return {
      supported: false,
      reason: "Voice input requires HTTPS or localhost.",
    };
  }

  const Recognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!Recognition) {
    return {
      supported: false,
      reason: "Speech recognition is not supported in this browser or WebView.",
    };
  }

  return {
    supported: true,
    Recognition,
    reason: null,
  };
}

export function createSpeechToTextService({
  lang = "vi-VN",
  onListening,
  onTranscribing,
  onCompleted,
  onFailed,
  onEnd,
}) {
  const support = getSpeechRecognitionSupport();

  if (!support.supported) {
    throw new Error(support.reason);
  }

  const recognition = new support.Recognition();

  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let completed = false;
  let failed = false;
  let cancelled = false;
  let transcribing = false;

  function reportTranscribing() {
    if (transcribing || completed || failed || cancelled) return;

    transcribing = true;
    onTranscribing?.();
  }

  recognition.onstart = () => {
    if (!cancelled) {
      onListening?.();
    }
  };

  recognition.onspeechend = () => {
    if (cancelled) return;

    reportTranscribing();
    recognition.stop();
  };

  recognition.onresult = (event) => {
    if (cancelled || completed || failed) return;

    const transcript = Array.from(event.results || [])
      .filter((result) => result.isFinal)
      .map((result) => result[0]?.transcript || "")
      .join(" ")
      .trim();

    if (!transcript) return;

    reportTranscribing();
    completed = true;

    onCompleted?.(transcript);
  };

  recognition.onerror = (event) => {
    if (cancelled || completed || failed) return;

    failed = true;
    onFailed?.(event.error || "recognition_error");
  };

  recognition.onend = () => {
    if (!cancelled && !completed && !failed) {
      failed = true;
      onFailed?.("no_speech");
    }

    onEnd?.();
  };

  return {
    start() {
      recognition.start();
    },

    stop() {
      if (completed || failed || cancelled) return;

      reportTranscribing();
      recognition.stop();
    },

    cancel() {
      cancelled = true;
      recognition.abort();
    },
  };
}
