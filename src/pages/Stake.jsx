import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WalletConnect from "../components/WalletConnect";
import AIAssistant from "../components/AIAssistant";
import ShareModal from "../components/ShareModal";
import ProofCardETH from "../components/ProofCardETH";
import CheckpointEventLogPanel from "../components/CheckpointEventLogPanel";
import {
  hasStakeStartConfirmedOnce,
  markStakeStartConfirmedOnce,
  hasStakeYieldUpdateConfirmedOnce,
  markStakeYieldUpdateConfirmedOnce,
  hasStakeClaimConfirmedOnce,
  markStakeClaimConfirmedOnce,
  hasFirstEconomicCycleCompletedOnce,
  markFirstEconomicCycleCompletedOnce,
  logStakeTransfer,
  logEthClaim,
  pauseAi,
  resumeAi,
  triggerManualOverride,
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

export default function Stake() {
  const [stakeAmount, setStakeAmount] = useState("");
  const [earning, setEarning] = useState(0);
  const [isEarning, setIsEarning] = useState(false);
  const [isAiPaused, setIsAiPaused] = useState(false);
  const [resultEth, setResultEth] = useState(null);
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);
  const [earnedEth, setEarnedEth] = useState(0);

  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [hasConfirmedStakeOnce, setHasConfirmedStakeOnce] = useState(
    hasStakeStartConfirmedOnce(),
  );
  const [hasConfirmedYieldUpdateOnce, setHasConfirmedYieldUpdateOnce] =
    useState(hasStakeYieldUpdateConfirmedOnce());
  const [hasConfirmedClaimOnce, setHasConfirmedClaimOnce] = useState(
    hasStakeClaimConfirmedOnce(),
  );

  const [hasTriggeredYieldCheckpoint, setHasTriggeredYieldCheckpoint] =
    useState(false);
  const [isYieldCheckpointLocked, setIsYieldCheckpointLocked] = useState(false);
  const [hasClaimedEth, setHasClaimedEth] = useState(false);

  const [hasCompletedFirstCycleOnce, setHasCompletedFirstCycleOnce] = useState(
    hasFirstEconomicCycleCompletedOnce(),
  );

  const APR = 18;
  const ETH_PRICE = 4900;

  const canPause = isEarning || isAiPaused;
  const canManualOverride = isEarning;

  const handleStake = () => {
    if (!stakeAmount || isNaN(stakeAmount) || stakeAmount <= 0) return;
    setIsAiPaused(false);
    setEarning(0);
    setIsEarning(true);
    setResultEth(null);
    setEarnedEth(0);

    setHasTriggeredYieldCheckpoint(false);
    setIsYieldCheckpointLocked(false);
    setHasClaimedEth(false);
  };

  const requestStakeCheckpoint = () => {
    if (!stakeAmount || isNaN(stakeAmount) || stakeAmount <= 0) return;
    setPendingAction("start-staking");
    setShowCheckpoint(true);
  };

  const requestClaimCheckpoint = () => {
    if (resultEth === null || hasClaimedEth) return;
    setPendingAction("claim-eth");
    setShowCheckpoint(true);
  };

  const requestManualOverride = () => {
    if (!canManualOverride) return;
    setPendingAction("manual-override");
    setShowCheckpoint(true);
  };

  const closeCheckpoint = () => {
    if (
      pendingAction === "first-yield-update" ||
      pendingAction === "first-cycle-complete"
    ) {
      return;
    }

    setPendingAction(null);
    setShowCheckpoint(false);
  };

  const confirmCheckpoint = () => {
    if (pendingAction === "start-staking") {
      if (!hasConfirmedStakeOnce) {
        markStakeStartConfirmedOnce();
        setHasConfirmedStakeOnce(true);
      }

      logStakeTransfer(
        {
          page: "stake",
          stakeAmount: Number(stakeAmount),
          assetFrom: "BRC",
          assetTo: "ETH",
        },
        "stake",
      );

      handleStake();
      setPendingAction(null);
      setShowCheckpoint(false);
      return;
    }

    if (pendingAction === "first-yield-update") {
      if (!hasConfirmedYieldUpdateOnce) {
        markStakeYieldUpdateConfirmedOnce();
        setHasConfirmedYieldUpdateOnce(true);
      }

      setIsYieldCheckpointLocked(false);
      setPendingAction(null);
      setShowCheckpoint(false);
      return;
    }

    if (pendingAction === "claim-eth") {
      if (!hasConfirmedClaimOnce) {
        markStakeClaimConfirmedOnce();
        setHasConfirmedClaimOnce(true);
      }

      logEthClaim(
        {
          page: "stake",
          claimAmount: Number((resultEth ?? 0).toFixed(6)),
          token: "ETH",
        },
        "stake",
      );

      setHasClaimedEth(true);

      if (!hasCompletedFirstCycleOnce) {
        setPendingAction("first-cycle-complete");
        return;
      }

      setShowShare(true);
      setPendingAction(null);
      setShowCheckpoint(false);
      return;
    }

    if (pendingAction === "first-cycle-complete") {
      if (!hasCompletedFirstCycleOnce) {
        markFirstEconomicCycleCompletedOnce();
        setHasCompletedFirstCycleOnce(true);
      }

      setShowShare(true);
      setPendingAction(null);
      setShowCheckpoint(false);
      return;
    }

    if (pendingAction === "manual-override") {
      triggerManualOverride(
        {
          page: "stake",
          currentYield: Number(earning.toFixed(6)),
          isEarning,
        },
        "stake",
      );

      setIsAiPaused(true);

      if (isEarning) {
        setIsEarning(false);
        setResultEth(earning);
        setEarnedEth(earning);
      }

      speak("Manual override triggered. Staking flow halted.");
      setPendingAction(null);
      setShowCheckpoint(false);
      return;
    }
  };

  const handlePauseAi = () => {
    if (!isEarning && !isAiPaused) return;

    pauseAi(
      {
        page: "stake",
        currentYield: Number(earning.toFixed(6)),
        isEarning,
      },
      "stake",
    );

    setIsAiPaused(true);
    speak("AI paused for this staking session.");
  };

  const handleResumeAi = () => {
    resumeAi();
    setIsAiPaused(false);
    speak("AI resumed.");
  };

  useEffect(() => {
    if (!isEarning || isYieldCheckpointLocked || isAiPaused) return;

    const principal = parseFloat(stakeAmount);
    const yearlyRate = APR / 100;
    const ethPerSec = (principal * yearlyRate) / (365 * 24 * 3600);

    const interval = setInterval(() => {
      setEarning((prev) => parseFloat((prev + ethPerSec).toFixed(8)));
    }, 1000);

    return () => clearInterval(interval);
  }, [isEarning, isYieldCheckpointLocked, isAiPaused, stakeAmount]);

  useEffect(() => {
    if (!isEarning) return;
    if (hasConfirmedYieldUpdateOnce) return;
    if (hasTriggeredYieldCheckpoint) return;
    if (earning <= 0) return;

    setPendingAction("first-yield-update");
    setShowCheckpoint(true);
    setHasTriggeredYieldCheckpoint(true);
    setIsYieldCheckpointLocked(true);
  }, [
    earning,
    isEarning,
    hasConfirmedYieldUpdateOnce,
    hasTriggeredYieldCheckpoint,
  ]);

  useEffect(() => {
    if (isEarning && !isAiPaused) {
      speak("Staking activated. Monitoring your ETH yield in real time.");
    }
  }, [isEarning, isAiPaused]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gradient-to-b from-black via-[#021c1a] to-[#041a18] relative overflow-hidden">
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

      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,238,224,0.04),rgba(0,0,0,0.9))]"
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <div className="z-10 text-center p-6 bg-[#062e2a]/80 rounded-2xl shadow-[0_0_40px_rgba(124,238,224,0.15)] max-w-md w-full border border-[#a4f4d9]/30">
        {/* Trạng thái 1: Chưa stake */}
        {!isEarning && resultEth === null && (
          <>
            <h1 className="text-2xl font-bold text-[#a4f4d9] mb-2">
              Stake BRC → Earn ETH
            </h1>
            <p className="text-sm text-[#bdeee0] mb-6">
              Current APR:{" "}
              <span className="text-purple-400 font-semibold">
                {APR}% / year
              </span>
            </p>

            {/* Connect Wallet before staking */}
            <div className="flex justify-center mb-4">
              <WalletConnect />
            </div>

            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Enter BRC amount"
              className="w-full p-3 rounded-lg text-black font-semibold mb-4 focus:outline-none"
            />

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={requestStakeCheckpoint}
              className="bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] text-black font-semibold py-2 px-6 rounded-xl hover:from-[#a4f4d9] hover:to-[#7ceee0] transition-all w-full"
            >
              Start Staking
            </motion.button>

            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-[#bdeee0] mt-4 hover:text-[#a4f4d9] transition-all"
            >
              ← Back to Dashboard
            </button>
          </>
        )}

        {/* Trạng thái 2: Đang stake */}
        {isEarning && (
          <div className="flex flex-col items-center justify-center">
            <div className="absolute top-6 right-6 z-20">
              <WalletConnect />
            </div>

            {/* --- ETH Earning Core --- */}
            <div className="relative w-full flex items-center justify-center mt-8">
              <motion.div
                className="relative w-80 h-80 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              >
                {/* Outer glow */}
                <motion.div
                  className="absolute inset-[-10px] rounded-full bg-gradient-to-tr from-[#a4f4d9]/15 to-[#7ceee0]/25 blur-3xl z-0"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />

                {/* Rotating ring */}
                <motion.div
                  className="absolute inset-[-6px] rounded-full border-[5px] border-t-[#a4f4d9] border-transparent opacity-80 z-0"
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
                />

                {/* Floating ETH crystal */}
                <motion.img
                  src="/assets/eth-logo.gif"
                  alt="ETH"
                  className="w-36 h-36 relative z-10 mix-blend-screen brightness-125 drop-shadow-[0_0_25px_rgba(164,244,217,0.7)]"
                  animate={{
                    y: [0, -10, 0],
                    scale: [1, 1.08, 1],
                    opacity: [0.85, 1, 0.85],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Reflection glow */}
                <motion.div
                  className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-[#7ceee0]/10 to-transparent blur-2xl"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                />

                {/* Earning text */}
                <motion.p
                  key={earning}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute bottom-10 text-2xl font-bold text-[#a4f4d9] tracking-wide drop-shadow-[0_0_15px_rgba(164,244,217,0.8)] z-20"
                >
                  +{earning.toFixed(6)} ETH
                </motion.p>
              </motion.div>
            </div>

            <motion.p
              className="text-sm text-[#bdeee0] mt-2"
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ≈ ${(earning * ETH_PRICE).toFixed(2)} USD
            </motion.p>

            <motion.p className="text-xs font-mono text-[#7ceee0] mt-3">
              {isAiPaused ? "AI PAUSED" : "STAKING ACTIVE"}
            </motion.p>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setIsEarning(false);
                setResultEth(earning);
                setEarnedEth(earning);
                speak(
                  `Staking complete. You earned ${earning.toFixed(5)} ETH.`,
                );
              }}
              className="bg-gradient-to-r from-[#ff7070] to-[#ff9b9b] text-white font-semibold py-2 px-6 rounded-xl hover:from-[#ff5c5c] transition-all mt-6"
            >
              Stop Earning
            </motion.button>
          </div>
        )}

        {/* Trạng thái 3: Hiển thị kết quả */}
        {!isEarning && resultEth !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center"
          >
            <h1 className="text-2xl font-bold text-[#a4f4d9] mb-3">
              ✅ Earning Stopped
            </h1>
            <p className="text-lg text-[#7ceee0]">
              You’ve Earned:{" "}
              <span className="font-semibold">+{resultEth.toFixed(5)} ETH</span>
            </p>
            <p className="text-[#bdeee0] mb-6">
              ≈ ${(resultEth * ETH_PRICE).toFixed(2)} USD
            </p>

            <div className="flex w-full flex-col gap-3">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={requestClaimCheckpoint}
                disabled={hasClaimedEth}
                className={`py-2 px-6 rounded-xl font-semibold transition-all ${
                  hasClaimedEth
                    ? "bg-zinc-700 text-zinc-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] text-black hover:from-[#a4f4d9] hover:to-[#7ceee0]"
                }`}
              >
                {hasClaimedEth ? "ETH Claimed" : "Claim ETH"}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setResultEth(null);
                  setStakeAmount("");
                  setHasClaimedEth(false);
                }}
                className="bg-transparent border border-[#a4f4d9]/30 text-[#bdeee0] font-semibold py-2 px-6 rounded-xl hover:bg-white/5 transition-all"
              >
                Stake Again
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Hidden proof card để chụp */}
      <div className="hidden">
        <ProofCardETH
          username="Neo"
          amount={earnedEth.toFixed(3)}
          token="ETH"
          address="0xABCD...1234"
        />
      </div>

      {/* Share Modal */}
      <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        amount={earnedEth.toFixed(3)} // số ETH thật
        token="ETH"
      />

      {/* AI Assistant hoặc hiệu ứng khác */}
      <AIAssistant />

      {showCheckpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-[#a4f4d9]/30 bg-[#041a18] p-6 shadow-[0_0_40px_rgba(124,238,224,0.12)]">
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#7ceee0]">
              Bravium Checkpoint
            </p>

            {pendingAction === "start-staking" && (
              <>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  {hasConfirmedStakeOnce
                    ? "Confirm BRC → ETH Staking"
                    : "Confirm First BRC → ETH Staking"}
                </h2>

                <p className="mb-2 text-sm leading-6 text-[#bdeee0]">
                  {hasConfirmedStakeOnce
                    ? "You are about to move BRC into the ETH staking flow. Please confirm before continuing."
                    : "This is the first staking action in your current Bravium flow. Please confirm before locking BRC into ETH earning."}
                </p>

                <div className="mb-6 rounded-xl border border-[#a4f4d9]/20 bg-black/20 px-4 py-3 text-sm text-white">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#bdeee0]">Stake Amount</span>
                    <span className="font-semibold text-[#a4f4d9]">
                      {stakeAmount || 0} BRC
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeCheckpoint}
                    className="flex-1 rounded-xl border border-[#a4f4d9]/20 px-4 py-3 text-sm font-medium text-[#bdeee0] transition hover:bg-white/5"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmCheckpoint}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    Confirm & Stake
                  </button>
                </div>
              </>
            )}

            {pendingAction === "first-yield-update" && (
              <>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  Confirm First ETH Yield Update
                </h2>

                <p className="mb-2 text-sm leading-6 text-[#bdeee0]">
                  Your first live ETH yield update has been detected. Confirm
                  this checkpoint to resume staking flow and continue real-time
                  ETH accumulation.
                </p>

                <div className="mb-6 rounded-xl border border-[#a4f4d9]/20 bg-black/20 px-4 py-3 text-sm text-white">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#bdeee0]">Current Yield</span>
                    <span className="font-semibold text-[#a4f4d9]">
                      +{earning.toFixed(6)} ETH
                    </span>
                  </div>
                </div>

                <button
                  onClick={confirmCheckpoint}
                  className="w-full rounded-xl bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Confirm & Resume Yield
                </button>
              </>
            )}

            {pendingAction === "claim-eth" && (
              <>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  {hasConfirmedClaimOnce
                    ? "Confirm ETH Claim"
                    : "Confirm First ETH Claim"}
                </h2>

                <p className="mb-2 text-sm leading-6 text-[#bdeee0]">
                  {hasConfirmedClaimOnce
                    ? "You are about to claim your ETH from the current staking cycle. Please confirm before continuing."
                    : "This is the first ETH claim in your current Bravium staking flow. Please confirm before finalizing the earned ETH."}
                </p>

                <div className="mb-6 rounded-xl border border-[#a4f4d9]/20 bg-black/20 px-4 py-3 text-sm text-white">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#bdeee0]">Claim Amount</span>
                    <span className="font-semibold text-[#a4f4d9]">
                      +{(resultEth ?? 0).toFixed(6)} ETH
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeCheckpoint}
                    className="flex-1 rounded-xl border border-[#a4f4d9]/20 px-4 py-3 text-sm font-medium text-[#bdeee0] transition hover:bg-white/5"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmCheckpoint}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                  >
                    Confirm & Claim
                  </button>
                </div>
              </>
            )}

            {pendingAction === "first-cycle-complete" && (
              <>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  Confirm First Economic Cycle Complete
                </h2>

                <p className="mb-2 text-sm leading-6 text-[#bdeee0]">
                  Your first Bravium economic cycle has reached completion.
                  Confirm this checkpoint to record the cycle from staking
                  activation to ETH claim.
                </p>

                <div className="mb-6 rounded-xl border border-[#a4f4d9]/20 bg-black/20 px-4 py-3 text-sm text-white">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#bdeee0]">Cycle Result</span>
                    <span className="font-semibold text-[#a4f4d9]">
                      +{(resultEth ?? 0).toFixed(6)} ETH
                    </span>
                  </div>
                </div>

                <button
                  onClick={confirmCheckpoint}
                  className="w-full rounded-xl bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Confirm Cycle Completion
                </button>
              </>
            )}

            {pendingAction === "manual-override" && (
              <>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  Confirm Manual Override
                </h2>

                <p className="mb-2 text-sm leading-6 text-[#bdeee0]">
                  Manual Override will immediately halt the current staking flow
                  and return control to you. Confirm only if you want to
                  interrupt automation now.
                </p>

                <div className="mb-6 rounded-xl border border-[#ff8c8c]/20 bg-black/20 px-4 py-3 text-sm text-white">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#ffb4b4]">Current Yield</span>
                    <span className="font-semibold text-[#ffb4b4]">
                      +{earning.toFixed(6)} ETH
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={closeCheckpoint}
                    className="flex-1 rounded-xl border border-[#a4f4d9]/20 px-4 py-3 text-sm font-medium text-[#bdeee0] transition hover:bg-white/5"
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
      <CheckpointEventLogPanel />
    </div>
  );
}
