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

  let transcribingTimeout = null;
  let endReported = false;

  function clearTranscribingTimeout() {
    if (transcribingTimeout !== null) {
      clearTimeout(transcribingTimeout);
      transcribingTimeout = null;
    }
  }

  function finish() {
    if (endReported) return;

    endReported = true;
    clearTranscribingTimeout();

    onEnd?.();
  }

  function reportFailure(code) {
    if (completed || failed || cancelled) return;

    failed = true;
    clearTranscribingTimeout();

    onFailed?.(code);
  }

  function reportTranscribing() {
    if (transcribing || completed || failed || cancelled) return;

    transcribing = true;
    onTranscribing?.();

    // Prevent Android Chrome from waiting indefinitely.
    transcribingTimeout = setTimeout(() => {
      if (completed || failed || cancelled) return;

      reportFailure("recognition_timeout");

      try {
        recognition.abort();
      } catch {
        // Recognition may already be disconnected.
      }

      finish();
    }, 10000);
  }

  function stopRecognition() {
    if (completed || failed || cancelled || transcribing) return;

    reportTranscribing();

    try {
      recognition.stop();
    } catch {
      reportFailure("stop_failed");
      finish();
    }
  }

  recognition.onstart = () => {
    if (!cancelled) {
      onListening?.();
    }
  };

  recognition.onspeechend = () => {
    if (cancelled) return;

    stopRecognition();
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

    clearTranscribingTimeout();

    onCompleted?.(transcript);
  };

  recognition.onerror = (event) => {
    reportFailure(event.error || "recognition_error");
  };

  recognition.onend = () => {
    if (!cancelled && !completed && !failed) {
      reportFailure("no_speech");
    }

    finish();
  };

  return {
    start() {
      recognition.start();
    },

    stop() {
      stopRecognition();
    },

    cancel() {
      if (cancelled) return;

      cancelled = true;
      clearTranscribingTimeout();

      try {
        recognition.abort();
      } catch {
        // Ignore cleanup failures.
      }

      finish();
    },
  };
}
