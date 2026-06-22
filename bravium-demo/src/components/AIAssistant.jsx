import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import AIAssistantShell from "./assistant/AIAssistantShell";
import { buildAssistantContext } from "../lib/assistantContextBuilder";
import { routeAssistantRequest } from "../lib/assistantRouter";
import { logAssistantEvent } from "../lib/assistantEventLogger";

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
  sessionId = "",
  recentEvents = [],
  latestAlerts = [],
  financeContext = {},
  userState = {},
  logEvent,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [response, setResponse] = useState(null);

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

  const handleUserMessage = (msg) => {
    if (!msg.trim()) return;

    const context = buildAssistantContext({
      inputText: msg.trim(),
      inputSource: "ask_bravium_floating_button",
      currentPage: pageContext.currentPage,
      currentFeature: pageContext.currentFeature,
      sessionId,
      recentEvents,
      latestAlerts,
      financeContext,
      userState,
    });

    logAssistantEvent(logEvent, "ai_assistant_request_created", {
      input_text: context.input_text,
      input_source: context.input_source,
      current_page: context.current_page,
      current_feature: context.current_feature,
      session_id: context.session_id,
    });

    const routedResponse = routeAssistantRequest(context);

    logAssistantEvent(logEvent, "ai_assistant_routed", {
      mode: routedResponse.mode,
      source_context_used: routedResponse.source_context_used,
    });

    setResponse(routedResponse);

    logAssistantEvent(logEvent, "ai_assistant_response_rendered", {
      mode: routedResponse.mode,
      needs_user_attention: routedResponse.needs_user_attention,
      needs_user_approval: routedResponse.needs_user_approval,
    });

    speak(
      routedResponse.answer_text,
      routedResponse.needs_user_attention ? "serious" : "calm",
    );
  };

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
            onClick={() => setIsOpen(false)}
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

              <input
                type="text"
                placeholder="Ask about the current system state..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUserMessage(inputText);
                    setInputText("");
                  }
                }}
                className="w-full rounded-lg border border-[#a4f4d9]/30 bg-[#021c1a] p-2 text-sm text-[#a4f4d9] focus:outline-none"
              />

              <AIAssistantShell
                response={response}
                emptyText="The old stub response has been replaced. Ask Bravium now returns a structured shell response based on context-aware routing."
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </>
  );
}
