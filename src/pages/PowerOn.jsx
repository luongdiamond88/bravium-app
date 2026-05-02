import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  hasFirstPowerOnConfirmedOnce,
  markFirstPowerOnConfirmedOnce,
  logFirstPowerOn,
} from "../config/checkpoints";

export default function PowerOn() {
  const navigate = useNavigate();
  const messages = [
    "Initiating Neural Network Sync...",
    "AI Core Online.",
    "Bravium Protocol Activated.",
  ];

  const initialConfirmed = hasFirstPowerOnConfirmedOnce();

  const [step, setStep] = useState(0);
  const [hasConfirmedFirstPowerOn, setHasConfirmedFirstPowerOn] = useState(
    initialConfirmed
  );
  const [showPowerOnCheckpoint, setShowPowerOnCheckpoint] = useState(
    !initialConfirmed
  );
  const [bootStarted, setBootStarted] = useState(initialConfirmed);

  useEffect(() => {
    if (!bootStarted) return;

    const timer = setInterval(() => {
      setStep((s) => (s < messages.length - 1 ? s + 1 : s));
    }, 1200);

    const redirect = setTimeout(() => navigate("/dashboard"), 4200);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [bootStarted, navigate]);

  const cancelFirstPowerOnCheckpoint = () => {
    setShowPowerOnCheckpoint(false);
  };

  const confirmFirstPowerOnCheckpoint = () => {
    if (!hasConfirmedFirstPowerOn) {
      markFirstPowerOnConfirmedOnce();
      logFirstPowerOn(
        {
          page: "powerOn",
        },
        "powerOn"
      );
      setHasConfirmedFirstPowerOn(true);
    }

    setShowPowerOnCheckpoint(false);
    setBootStarted(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-[#021c1a] to-[#041a18] text-[#a4f4d9] relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-[#7ceee0]/5 via-transparent to-[#a4f4d9]/5 pointer-events-none"
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      />

      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full bg-[#7ceee0]/15 blur-3xl"
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <motion.img
        src="/assets/bravium-logo.png"
        alt="Bravium"
        className="w-40 mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
      />

      <motion.h1
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="font-mono text-lg tracking-widest text-center"
      >
        {bootStarted ? messages[step] : "Awaiting First Power On Confirmation..."}
      </motion.h1>

      <motion.div className="mt-10 h-[3px] w-60 bg-[#7ceee0]/20 overflow-hidden rounded-full">
        <motion.div
          className="h-full bg-gradient-to-r from-[#a4f4d9] to-[#7ceee0]"
          initial={{ width: 0 }}
          animate={{ width: bootStarted ? "100%" : 0 }}
          transition={{ duration: 3.5, ease: "easeInOut" }}
        />
      </motion.div>

      {showPowerOnCheckpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-yellow-500/30 bg-zinc-950 p-6 shadow-2xl">
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-yellow-500">
              Bravium Checkpoint
            </p>

            <h2 className="mb-3 text-xl font-semibold text-white">
              Confirm First Power On
            </h2>

            <p className="mb-6 text-sm leading-6 text-zinc-300">
              This is the first power-on confirmation for this device flow.
              Confirm to continue booting into the Bravium dashboard and write
              the event to the checkpoint log.
            </p>

            <div className="flex gap-3">
              <button
                onClick={cancelFirstPowerOnCheckpoint}
                className="flex-1 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900"
              >
                Cancel
              </button>

              <button
                onClick={confirmFirstPowerOnCheckpoint}
                className="flex-1 rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Confirm & Power On
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}