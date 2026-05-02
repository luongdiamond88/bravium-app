import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import AIAssistant from "../components/AIAssistant";
import ReferralLink from "../components/ReferralLink";
import ConnectionBridgeFX from "../components/ConnectionBridgeFX";
import BraviumIDCard from "../components/BraviumIDCard";
import ShareModal from "../components/ShareModal";
import ProofCard from "../components/ProofCard";
import CheckpointEventLogPanel from "../components/CheckpointEventLogPanel";
import {
  startNewSession,
  confirmAiActivation,
  pauseAi,
  resumeAi,
  triggerManualOverride,
  hasFirstBrcMiningConfirmedOnce,
  markFirstBrcMiningConfirmedOnce,
  logFirstBrcMining,
  hasFirstHistoryRecordConfirmedOnce,
  markFirstHistoryRecordConfirmedOnce,
  logFirstHistoryRecord,
} from "../config/checkpoints";

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.pitch = 0.9;
  utter.rate = 1;
  const voices = speechSynthesis.getVoices();
  const male =
    voices.find((v) => v.name.toLowerCase().includes("male")) || voices[0];
  if (male) utter.voice = male;
  speechSynthesis.speak(utter);
}

export default function Dashboard() {
  const { darkMode, setDarkMode } = useTheme();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [brc, setBrc] = useState(0);
  const [isEarning, setIsEarning] = useState(false);
  const [isAiPaused, setIsAiPaused] = useState(false);
  const [showBridge, setShowBridge] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [hasConfirmedFirstMiningOnce, setHasConfirmedFirstMiningOnce] =
    useState(hasFirstBrcMiningConfirmedOnce());
  const [showFirstMiningCard, setShowFirstMiningCard] = useState(false);
  const [hasDismissedFirstMiningCard, setHasDismissedFirstMiningCard] =
    useState(false);

  const [
    hasConfirmedFirstHistoryRecordOnce,
    setHasConfirmedFirstHistoryRecordOnce,
  ] = useState(hasFirstHistoryRecordConfirmedOnce());
  const [showFirstHistoryCard, setShowFirstHistoryCard] = useState(false);

  const canPause = isEarning || isAiPaused;
  const canManualOverride = isEarning;

  useEffect(() => {
    const hash = window.location.hash;
    const query = hash.split("?")[1];
    if (query) {
      const params = new URLSearchParams(query);
      if (params.get("joined") === "1") setShowBridge(true);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const chars = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#7ceee0";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, isEarning && !isAiPaused ? 25 : 45);
    return () => clearInterval(interval);
  }, [isEarning, isAiPaused]);

  useEffect(() => {
    if (!isEarning || isAiPaused) return;

    const interval = setInterval(() => {
      setBrc((prev) => parseFloat((prev + Math.random() * 0.0015).toFixed(4)));
    }, 900);

    return () => clearInterval(interval);
  }, [isEarning, isAiPaused]);

  useEffect(() => {
    if (!isEarning) {
      setShowFirstMiningCard(false);
      return;
    }

    if (brc <= 0) return;
    if (hasConfirmedFirstMiningOnce) return;
    if (hasDismissedFirstMiningCard) return;

    setShowFirstMiningCard(true);
  }, [
    isEarning,
    brc,
    hasConfirmedFirstMiningOnce,
    hasDismissedFirstMiningCard,
  ]);

  const handleStart = () => {
    setIsAiPaused(false);
    setIsEarning(true);
    setBrc(0);
    setHasDismissedFirstMiningCard(false);
    setShowFirstHistoryCard(false);
    speak("Earning mode activated. Energy core online.");
  };

  const handleStop = () => {
    setIsEarning(false);
    setShowFirstMiningCard(false);
    speak(`Earning session complete. You have earned ${brc.toFixed(3)} BRC.`);
    alert(`Session complete: +${brc.toFixed(3)} BRC`);
    setTimeout(() => setShowShare(true), 150);
  };

  const handleStake = () => {
    speak("Switching to staking protocol. Preparing to earn ETH.");
    navigate("/stake");
  };

  const runEarnMoreBrcFlow = () => {
    speak("Opening your daily tasks now.");
    window.location.hash = "#/tasks";
  };

  const requestAiActivation = () => {
    setPendingAction("ai-activation");
    setShowCheckpoint(true);
  };

  const requestManualOverride = () => {
    if (!canManualOverride) return;
    setPendingAction("manual-override");
    setShowCheckpoint(true);
  };

  const requestFirstHistoryRecordCheckpoint = () => {
    if (hasConfirmedFirstHistoryRecordOnce) {
      runEarnMoreBrcFlow();
      return;
    }

    setShowFirstHistoryCard(true);
  };

  const closeCheckpoint = () => {
    setPendingAction(null);
    setShowCheckpoint(false);
  };

  const confirmCheckpoint = () => {
    if (pendingAction === "ai-activation") {
      startNewSession("dashboard");
      confirmAiActivation(
        {
          page: "dashboard",
          mode: "brc_earning",
        },
        "dashboard",
      );

      handleStart();
      closeCheckpoint();
      return;
    }

    if (pendingAction === "manual-override") {
      triggerManualOverride(
        {
          page: "dashboard",
          brc: Number(brc.toFixed(3)),
          isEarning,
        },
        "dashboard",
      );

      setIsAiPaused(true);
      setIsEarning(false);
      setShowFirstMiningCard(false);
      speak("Manual override triggered. Dashboard AI halted.");
      closeCheckpoint();
    }
  };

  const handlePauseAi = () => {
    if (!isEarning && !isAiPaused) return;

    pauseAi(
      {
        page: "dashboard",
        brc: Number(brc.toFixed(3)),
        isEarning,
      },
      "dashboard",
    );

    setIsAiPaused(true);
    speak("AI paused for this session.");
  };

  const handleResumeAi = () => {
    resumeAi();
    setIsAiPaused(false);
    speak("AI resumed.");
  };

  const confirmFirstMiningCheckpoint = () => {
    if (!hasConfirmedFirstMiningOnce) {
      markFirstBrcMiningConfirmedOnce();
      logFirstBrcMining(
        {
          page: "dashboard",
          brc: Number(brc.toFixed(3)),
        },
        "dashboard",
      );
      setHasConfirmedFirstMiningOnce(true);
    }

    setShowFirstMiningCard(false);
  };

  const cancelFirstMiningCheckpoint = () => {
    setShowFirstMiningCard(false);
    setHasDismissedFirstMiningCard(true);
  };

  const confirmFirstHistoryRecordCheckpoint = () => {
    if (!hasConfirmedFirstHistoryRecordOnce) {
      markFirstHistoryRecordConfirmedOnce();
      logFirstHistoryRecord(
        {
          page: "dashboard",
          action: "earn_more_brc",
          brc: Number(brc.toFixed(3)),
        },
        "dashboard",
      );
      setHasConfirmedFirstHistoryRecordOnce(true);
    }

    setShowFirstHistoryCard(false);
    runEarnMoreBrcFlow();
  };

  const cancelFirstHistoryRecordCheckpoint = () => {
    setShowFirstHistoryCard(false);
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 ${
        darkMode
          ? "bg-gradient-to-b from-black via-[#021c1a] to-[#041a18] text-white"
          : "bg-gradient-to-b from-gray-100 to-white text-gray-900"
      }`}
    >
      <div className="fixed top-5 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#a4f4d9]/20 bg-black/60 px-3 py-3 backdrop-blur-md">
        <button
          onClick={isAiPaused ? handleResumeAi : handlePauseAi}
          disabled={!canPause && !isAiPaused}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            !canPause && !isAiPaused
              ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              : isAiPaused
                ? "bg-zinc-800 text-[#a4f4d9] hover:bg-zinc-700"
                : "bg-[#a4f4d9] text-black hover:opacity-90"
          }`}
        >
          {isAiPaused ? "Resume AI" : "Pause AI"}
        </button>

        <button
          onClick={requestManualOverride}
          disabled={!canManualOverride}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            !canManualOverride
              ? "border border-zinc-700 bg-zinc-900 text-zinc-500 cursor-not-allowed"
              : "border border-[#ff8c8c]/30 bg-[#2b0b0b]/80 text-[#ffb4b4] hover:bg-[#3a1010]"
          }`}
        >
          Manual Override
        </button>
      </div>

      <div className="hidden">
        <ProofCard
          username="Neo"
          amount={brc.toFixed(3)}
          token="BRC"
          address="0xABCD...1234"
        />
      </div>

      <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        amount={brc.toFixed(3)}
        token="BRC"
      />

      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute bottom-6 left-6 z-50 p-2 rounded-full bg-[#a4f4d9]/20 hover:bg-[#a4f4d9]/40 transition"
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="absolute top-6 left-6 z-50">
        <ReferralLink address="0xABCD...1234" />
      </div>

      <div className="absolute top-6 right-6 z-30">
        <BraviumIDCard
          username="Neo"
          address="0xABCD...1234"
          rank="Silver"
          streak={12}
          energy={2680}
          totalEarn="0.224 ETH"
        />
      </div>

      <div className="relative w-80 h-80 flex items-center justify-center overflow-hidden rounded-full shadow-[0_0_60px_rgba(164,244,217,0.3)]">
        <canvas
          ref={canvasRef}
          width={320}
          height={320}
          className="absolute inset-0 opacity-80"
        />
        <motion.div
          className="absolute w-64 h-64 rounded-full blur-3xl bg-[#a4f4d9]/20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src="/assets/bravium-logo.png"
          alt="Bravium"
          className="w-32 h-32 relative z-10 opacity-90"
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.h1
        key={brc}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-4xl font-bold text-[#a4f4d9] mt-8 tracking-wide"
      >
        +{brc.toFixed(3)} BRC
      </motion.h1>

      <p className="text-sm text-[#7ceee0] mt-1">
        ≈ ${(brc * 0.08).toFixed(4)} USD
      </p>

      <motion.p
        className="text-xs font-mono text-[#7ceee0] mt-3"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isAiPaused
          ? "AI PAUSED"
          : isEarning
            ? "EARNING MODE ACTIVE"
            : "IDLE MODE"}
      </motion.p>

      <div className="flex flex-wrap justify-center gap-4 mt-10 z-10">
        {!isEarning ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={requestAiActivation}
            className="px-8 py-3 rounded-2xl font-semibold text-black bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] hover:from-[#a4f4d9] hover:to-[#7ceee0] transition-all shadow-[0_0_25px_rgba(164,244,217,0.3)]"
          >
            🚀 Start Earning BRC
          </motion.button>
        ) : (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              className="px-8 py-3 rounded-2xl font-semibold text-black bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] hover:from-[#a4f4d9] hover:to-[#7ceee0] transition-all shadow-[0_0_25px_rgba(164,244,217,0.3)]"
            >
              ⏹ Stop Earning
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStake}
              className="px-8 py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-purple-600 to-[#a4f4d9] hover:from-purple-500 hover:to-[#7ceee0] transition-all shadow-[0_0_25px_rgba(153,0,255,0.25)]"
            >
              💎 Stake → Earn ETH
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={requestFirstHistoryRecordCheckpoint}
              className="px-8 py-3 rounded-2xl font-semibold text-black bg-gradient-to-r from-yellow-200 to-[#7ceee0] hover:from-yellow-100 hover:to-[#a4f4d9] transition-all shadow-[0_0_25px_rgba(255,255,0,0.25)]"
            >
              💰 Earn More BRC
            </motion.button>
          </>
        )}
      </div>

      <ConnectionBridgeFX
        show={showBridge}
        onDone={() => setShowBridge(false)}
      />

      <AIAssistant />
      <CheckpointEventLogPanel />

      {showFirstMiningCard && !hasConfirmedFirstMiningOnce && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#a4f4d9]/30 bg-zinc-950 p-6 shadow-2xl">
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#7ceee0]">
              Bravium Checkpoint
            </p>

            <h2 className="mb-3 text-xl font-semibold text-white">
              Confirm First BRC Mining
            </h2>

            <p className="mb-6 text-sm leading-6 text-zinc-300">
              Your first live BRC mining activity has been detected. Confirm
              this checkpoint to acknowledge the first mining event and write it
              to the checkpoint log.
            </p>

            <div className="flex gap-3">
              <button
                onClick={cancelFirstMiningCheckpoint}
                className="flex-1 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900"
              >
                Later
              </button>

              <button
                onClick={confirmFirstMiningCheckpoint}
                className="flex-1 rounded-xl bg-[#a4f4d9] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Confirm Mining
              </button>
            </div>
          </div>
        </div>
      )}

      {showFirstHistoryCard && !hasConfirmedFirstHistoryRecordOnce && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#a4f4d9]/30 bg-zinc-950 p-6 shadow-2xl">
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#7ceee0]">
              Bravium Checkpoint
            </p>

            <h2 className="mb-3 text-xl font-semibold text-white">
              Your history has begun
            </h2>

            <p className="mb-6 text-sm leading-6 text-zinc-300">
              This is the first moment your Bravium activity is being
              acknowledged as a history record. Confirm to continue to Earn More
              BRC and write this checkpoint to the event log.
            </p>

            <div className="flex gap-3">
              <button
                onClick={cancelFirstHistoryRecordCheckpoint}
                className="flex-1 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900"
              >
                Later
              </button>

              <button
                onClick={confirmFirstHistoryRecordCheckpoint}
                className="flex-1 rounded-xl bg-[#a4f4d9] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-yellow-500/30 bg-zinc-950 p-6 shadow-2xl">
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-yellow-500">
              Bravium Checkpoint
            </p>

            {pendingAction === "ai-activation" && (
              <>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  Confirm AI Activation for Session
                </h2>

                <p className="mb-6 text-sm leading-6 text-zinc-300">
                  You are about to activate AI earning for this session. Confirm
                  to start a new live BRC earning session and write the
                  activation event to the checkpoint log.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={closeCheckpoint}
                    className="flex-1 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmCheckpoint}
                    className="flex-1 rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    Confirm & Start Session
                  </button>
                </div>
              </>
            )}

            {pendingAction === "manual-override" && (
              <>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  Confirm Manual Override
                </h2>

                <p className="mb-6 text-sm leading-6 text-zinc-300">
                  Manual Override will immediately halt the current dashboard AI
                  flow. Confirm only if you want to stop automated behavior and
                  take direct control.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={closeCheckpoint}
                    className="flex-1 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmCheckpoint}
                    className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Confirm Override
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
