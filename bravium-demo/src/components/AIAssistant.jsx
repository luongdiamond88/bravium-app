import { motion } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import AIAssistantShell from "./assistant/AIAssistantShell";
import { buildAssistantContext } from "../lib/assistantContextBuilder";
import { routeAssistantRequest } from "../lib/assistantRouter";
import { dispatchAssistantCapability } from "../lib/assistantCapabilityDispatcher";
import { submitScamAlert } from "../lib/scamAlertApi";
import { runCapitalGuardCheck } from "../lib/capitalGuardApi";
import { parseFixedExpenses } from "../lib/fixedExpensesApi";
import { askControlAssistant } from "../lib/controlAssistantApi";
import { logAssistantEvent } from "../lib/assistantEventLogger";
import { useVoiceInput } from "../hooks/useVoiceInput";
import VoiceInputButton from "./assistant/VoiceInputButton";
import {
  createUnifiedAssistantInput,
  assistantInputLogMetadata,
} from "../lib/assistantInputContract";

const CAPABILITY_SERVICES = {
  submitScamAlert,
  runCapitalGuardCheck,
  parseFixedExpenses,
  askControlAssistant,
};

// Voice feedback system
function speak(text, tone = "neutral") {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";

  if (tone === "happy") {
    utter.pitch = 1.3;
    utter.rate = 1;
  } else if (tone === "serious") {
    utter.pitch = 0.8;
    utter.rate = 0.9;
  } else if (tone === "calm") {
    utter.pitch = 1;
    utter.rate = 0.8;
  } else {
    utter.pitch = 1;
    utter.rate = 1;
  }

  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.name.toLowerCase().includes("english")) || voices[0];

  if (voice) {
    utter.voice = voice;
  }

  window.speechSynthesis.speak(utter);
}

function inferPageContext() {
  if (typeof window === "undefined") {
    return {
      currentPage: "",
      currentFeature: "",
    };
  }

  const path = window.location.pathname.toLowerCase();

  if (path.includes("scam-alert")) {
    return { currentPage: "scam-alert", currentFeature: "scam_alert" };
  }

  if (path.includes("fixed-expenses")) {
    return { currentPage: "fixed-expenses", currentFeature: "budget" };
  }

  if (path.includes("capital-guard")) {
    return { currentPage: "capital-guard", currentFeature: "capital_guard" };
  }

  if (path.includes("stake")) {
    return { currentPage: "stake", currentFeature: "staking" };
  }

  if (path.includes("power")) {
    return { currentPage: "power-on", currentFeature: "power_on" };
  }

  return { currentPage: "dashboard", currentFeature: "dashboard" };
}

export default function AIAssistant({
  userId = "",
  sessionId = "",
  recentEvents = [],
  latestAlerts = [],
  financeContext = {},
  userState = {},
  logEvent,
}) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [response, setResponse] = useState(null);
  const [voiceLanguage, setVoiceLanguage] = useState("vi-VN");
  const [draftInputSource, setDraftInputSource] = useState("text");
  const [isProcessing, setIsProcessing] = useState(false);
  const inFlightRef = useRef(false);

  const pageContext = useMemo(() => inferPageContext(), []);

  const talk = (msg) => {
    const text =
      msg || "Hello, I'm Bravium Assistant. The assistant shell is ready.";
    speak(text, "calm");
  };

  const handleOpen = () => {
    setIsOpen(true);
    talk();
    logAssistantEvent(logEvent, "ai_assistant_opened", {
      current_page: pageContext.currentPage,
      current_feature: pageContext.currentFeature,
      session_id: sessionId || "",
    });
  };

  async function handleUserMessage(msg, inputSource = draftInputSource) {
    if (inFlightRef.current) return false;

    // Read page at submit time, not from stale mount-time state.
    const livePage = inferPageContext();
    const query =
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search);
    const effectiveUserId =
      userId || userState?.userId || query.get("userId") || "";
    const effectiveSessionId = sessionId || query.get("sessionId") || "";

    const request = createUnifiedAssistantInput({
      text: msg,
      inputSource,
      currentPage: livePage.currentPage,
      currentFeature: livePage.currentFeature,
      sessionId: effectiveSessionId,
      recentEvents,
      latestAlerts,
      financeContext,
      userState,
    });

    if (!request) return false;

    // Only an explicit Send/Enter reaches this pipeline; mic does not auto-submit.
    inFlightRef.current = true;
    setIsProcessing(true);

    const context = {
      ...buildAssistantContext({
        inputText: request.input_text,
        inputSource: request.input_source,
        currentPage: request.current_page,
        currentFeature: request.current_feature,
        sessionId: request.session_id,
        recentEvents: request.recent_events,
        latestAlerts: request.latest_alerts,
        financeContext: request.finance_context,
        userState: request.optional_user_state,
      }),
      original_text: request.original_text,
    };

    const metadata = assistantInputLogMetadata(request);
    let routedResponse = null;

    try {
      if (request.input_source === "voice") {
        handleVoiceEvent("voice_command_received", metadata);
      }

      logAssistantEvent(logEvent, "ai_assistant_request_created", metadata);

      // P03.1 input -> P03.2 router -> P03.3 dispatcher. Same for text and voice.
      routedResponse = routeAssistantRequest(context);
      const routeMetadata = {
        ...metadata,
        mode: routedResponse.mode,
        intent: routedResponse.intent,
        target_module: routedResponse.target_module,
        routing_status: routedResponse.routing_status,
      };

      logAssistantEvent(logEvent, "ai_assistant_routed", routeMetadata);
      if (request.input_source === "voice") {
        handleVoiceEvent(
          routedResponse.intent === "unknown"
            ? "voice_intent_unrecognized"
            : "voice_intent_recognized",
          routeMetadata,
        );
      }

      const outcome = await dispatchAssistantCapability({
        route: routedResponse,
        request,
        userId: effectiveUserId,
        sessionId: effectiveSessionId,
        services: CAPABILITY_SERVICES,
      });

      setResponse(outcome.response);

      const resultMetadata = {
        ...routeMetadata,
        capability_status:
          outcome.response.capability_status || routedResponse.routing_status,
        dispatched: outcome.dispatched,
      };
      logAssistantEvent(
        logEvent,
        "ai_assistant_response_rendered",
        resultMetadata,
      );

      if (request.input_source === "voice" && outcome.dispatched) {
        handleVoiceEvent("voice_command_dispatched", resultMetadata);
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      const failure = {
        ...routedResponse,
        mode: routedResponse?.mode || "general_control_assistant",
        summary: "Assistant request failed",
        answer_text: `The request could not be completed: ${message}. Please retry.`,
        needs_user_attention: true,
        needs_user_approval: false,
        capability_status: "failed",
      };
      setResponse(failure);

      const failedMetadata = {
        ...metadata,
        intent: routedResponse?.intent || "unknown",
        target_module: routedResponse?.target_module || null,
        error_name: error instanceof Error ? error.name : "Error",
      };
      logAssistantEvent(logEvent, "ai_assistant_response_rendered", {
        ...failedMetadata,
        capability_status: "failed",
      });
      if (request.input_source === "voice") {
        handleVoiceEvent("voice_command_failed", failedMetadata);
      }
      return false;
    } finally {
      inFlightRef.current = false;
      setIsProcessing(false);
    }
  }

  async function submitMessage() {
    const submitted = await handleUserMessage(inputText, draftInputSource);

    if (submitted) {
      setInputText("");
      setDraftInputSource("text");
    }
  }

  function handleVoiceTranscript(transcript) {
    const cleanText = String(transcript || "").trim();
    if (!cleanText) return;

    setInputText((previous) => {
      const existing = previous.trimEnd();

      return existing ? `${existing} ${cleanText}` : cleanText;
    });

    setDraftInputSource("voice");
  }

  function handleVoiceEvent(type, payload = {}) {
    // Never log raw microphone audio or transcript text.
    const safePayload = {
      ...payload,
      current_page: pageContext.currentPage,
      current_feature: pageContext.currentFeature,
      input_source: "ask_bravium_microphone",
    };

    // Prefer the existing event logger passed by the parent.
    if (typeof logEvent === "function") {
      logAssistantEvent(logEvent, type, safePayload);
      return;
    }

    // Reuse the existing POST /events backend if context is valid.
    const query =
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search);

    const effectiveUserId =
      userId || userState?.userId || query.get("userId") || "";
    const effectiveSessionId = sessionId || query.get("sessionId") || "";

    const API_BASE = import.meta.env.VITE_BACKEND_URL;

    if (API_BASE && effectiveUserId && effectiveSessionId) {
      fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: effectiveUserId,
          sessionId: effectiveSessionId,
          type,
          source: "voice.input",
          payload: safePayload,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Event log HTTP ${res.status}`);
          }
        })
        .catch((err) => {
          console.warn("[Bravium Voice Event Log]", err);
        });

      return;
    }

    // Client-only fallback, not a persisted database event.
    logAssistantEvent(undefined, type, safePayload);
  }

  const voice = useVoiceInput({
    lang: voiceLanguage,
    onTranscript: handleVoiceTranscript,
    onEvent: handleVoiceEvent,
  });

  return (
    <>
      {!isOpen && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 transition-all hover:scale-105 focus:outline-none"
        >
          <img
            src="/assets/bravium-logo.png"
            alt="Bravium AI"
            className="h-16 w-16 object-contain drop-shadow-[0_0_20px_rgba(164,244,217,0.4)]"
          />
        </motion.button>
      )}

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 flex w-72 flex-col items-center rounded-2xl border border-[#a4f4d9]/30 bg-[#041a1c]/95 p-4 shadow-[0_0_30px_rgba(164,244,217,0.2)]"
        >
          <button
            onClick={() => {
              voice.cancel();
              setIsOpen(false);
            }}
            className="absolute right-3 top-3 text-[#bdeee0] transition hover:text-[#a4f4d9]"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-3 h-24 w-24">
            <img
              src="/assets/bravium-logo.png"
              alt="Bravium Robot"
              className="h-full w-full object-contain drop-shadow-[0_0_20px_rgba(164,244,217,0.3)]"
            />
          </div>

          <p className="mb-1 font-semibold text-[#a4f4d9]">Ask Bravium</p>
          <p className="mb-4 text-center text-sm leading-relaxed text-[#bdeee0]">
            Structured assistant shell is active. I can route your request using
            session, risk, finance, and event context.
          </p>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              talk(
                "Assistant shell ready. Current context has been loaded.",
                "happy",
              );
              setChatOpen(!chatOpen);
            }}
            className="rounded-xl bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] px-6 py-2 font-semibold text-black shadow-[0_0_20px_rgba(164,244,217,0.3)] transition-all duration-300 hover:from-[#a4f4d9] hover:to-[#7ceee0]"
          >
            {chatOpen ? "Close Assistant" : "Talk to Me"}
          </motion.button>

          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 w-full rounded-xl border border-[#a4f4d9]/20 bg-[#031d1b]/80 p-3"
            >
              <div className="mb-2 rounded-lg border border-zinc-800 bg-black/20 p-3 text-xs text-[#bdeee0]/70">
                <div>page: {pageContext.currentPage || "-"}</div>
                <div>feature: {pageContext.currentFeature || "-"}</div>
                <div>session: {sessionId || "-"}</div>
                <div>
                  events:{" "}
                  {Array.isArray(recentEvents) ? recentEvents.length : 0}
                </div>
                <div>
                  alerts:{" "}
                  {Array.isArray(latestAlerts) ? latestAlerts.length : 0}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type or speak your request..."
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      setDraftInputSource("text");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void submitMessage();
                      }
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-[#a4f4d9]/30 bg-[#021c1a] p-2 text-sm text-[#a4f4d9] focus:outline-none"
                  />

                  <VoiceInputButton
                    status={voice.status}
                    supported={voice.supported}
                    onStart={voice.start}
                    onStop={voice.stop}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void submitMessage()}
                  disabled={!inputText.trim() || isProcessing}
                  className="rounded-lg bg-[#a4f4d9] px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
                >
                  {isProcessing ? "Processing..." : "Send"}
                </button>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-[#bdeee0]/70">
                    {voice.status === "idle" && "Voice input ready"}
                    {voice.status === "listening" && "Listening..."}
                    {voice.status === "transcribing" && "Transcribing..."}
                    {voice.status === "ready" &&
                      "Text ready — review before sending"}
                    {voice.status === "error" && "Voice input unavailable"}
                  </p>

                  <select
                    value={voiceLanguage}
                    onChange={(e) => setVoiceLanguage(e.target.value)}
                    disabled={
                      voice.status === "listening" ||
                      voice.status === "transcribing"
                    }
                    aria-label="Voice input language"
                    className="rounded-lg border border-[#a4f4d9]/20 bg-[#021c1a] px-2 py-1 text-xs text-[#a4f4d9]"
                  >
                    <option value="vi-VN">Tiếng Việt</option>
                    <option value="en-US">English</option>
                  </select>
                </div>

                {!voice.supported && (
                  <p className="text-xs text-yellow-300">
                    {voice.unsupportedReason} You can still type your request.
                  </p>
                )}

                {voice.error && (
                  <p className="text-xs text-yellow-300">{voice.error}</p>
                )}
              </div>

              <AIAssistantShell
                response={response}
                emptyText="The old stub response has been replaced. Ask Bravium now returns a structured shell response based on context-aware routing."
              />
              {response?.action_url && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(response.action_url, {
                      state:
                        response.target_module === "capital_guard"
                          ? { investmentText: response.original_text }
                          : undefined,
                    })
                  }
                  className="mt-3 block rounded-lg border border-[#a4f4d9]/40 px-3 py-2 text-center text-sm text-[#a4f4d9]"
                >
                  Open{" "}
                  {response.target_module === "capital_guard"
                    ? "Capital Guard"
                    : "Fixed Expenses"}
                </button>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </>
  );
}
