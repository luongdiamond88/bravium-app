import { useCallback, useEffect, useRef, useState } from "react";

import {
  createSpeechToTextService,
  getSpeechRecognitionSupport,
} from "../services/speechToTextService";

const ERROR_MESSAGES = {
  "not-allowed": "Microphone permission was denied.",
  "service-not-allowed": "Speech recognition service is not allowed.",
  "audio-capture": "Microphone is unavailable.",
  "no-speech": "No speech was detected. Please try again.",
  no_speech: "No speech was detected. Please try again.",
  network: "Speech recognition network error.",
  recognition_timeout:
    "Speech recognition timed out. Please retry or type your request.",

  stop_failed: "Could not stop speech recognition. Please retry.",
  "language-not-supported": "Selected language is not supported.",
  aborted: "Speech recognition was interrupted.",
};

export function useVoiceInput({ lang = "vi-VN", onTranscript, onEvent }) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const serviceRef = useRef(null);
  const onTranscriptRef = useRef(onTranscript);
  const onEventRef = useRef(onEvent);

  onTranscriptRef.current = onTranscript;
  onEventRef.current = onEvent;

  const support = getSpeechRecognitionSupport();

  const emit = useCallback((type, payload = {}) => {
    onEventRef.current?.(type, payload);
  }, []);

  const fail = useCallback(
    (code) => {
      const safeCode = String(code || "recognition_error");

      const [errorKey, ...diagnostics] = safeCode.split("|");

      setStatus("error");

      setError(
        (ERROR_MESSAGES[errorKey] ||
          "Speech recognition failed. Please type instead.") +
          (diagnostics.length ? ` [${diagnostics.join(", ")}]` : ""),
      );

      emit("voice_input_failed", {
        error_code: safeCode,
        input_source: "ask_bravium_microphone",
      });
    },
    [emit],
  );

  const start = useCallback(() => {
    if (serviceRef.current) return;

    const currentSupport = getSpeechRecognitionSupport();

    if (!currentSupport.supported) {
      fail("unsupported");
      setError(currentSupport.reason);
      return;
    }

    setError("");
    setStatus("idle");

    try {
      const service = createSpeechToTextService({
        lang,

        onListening() {
          setStatus("listening");

          emit("voice_input_started", {
            language: lang,
            input_source: "ask_bravium_microphone",
          });
        },

        onTranscribing() {
          setStatus("transcribing");

          emit("voice_input_transcribing", {
            language: lang,
          });
        },

        onCompleted(transcript) {
          // Only inject text; never submit the assistant request.
          onTranscriptRef.current?.(transcript);

          setStatus("ready");

          emit("voice_input_completed", {
            language: lang,
            text_length: transcript.length,
            auto_submitted: false,
          });
        },

        onFailed(code) {
          fail(code);
        },

        onEnd() {
          serviceRef.current = null;
        },
      });

      serviceRef.current = service;
      service.start();
    } catch (err) {
      serviceRef.current = null;

      fail("start_failed");

      setError(
        err instanceof Error
          ? err.message
          : "Could not start speech recognition.",
      );
    }
  }, [lang, emit, fail]);

  const stop = useCallback(() => {
    serviceRef.current?.stop();
  }, []);

  const cancel = useCallback(() => {
    serviceRef.current?.cancel();
    serviceRef.current = null;

    setStatus("idle");
    setError("");
  }, []);

  useEffect(() => {
    return () => {
      serviceRef.current?.cancel();
      serviceRef.current = null;
    };
  }, []);

  return {
    status,
    error,
    supported: support.supported,
    unsupportedReason: support.reason,
    start,
    stop,
    cancel,
  };
}
