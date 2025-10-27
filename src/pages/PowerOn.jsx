import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function PowerOn() {
  const navigate = useNavigate();
  const messages = [
    "Initiating Neural Network Sync...",
    "AI Core Online.",
    "Bravium Protocol Activated.",
  ];

  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s < messages.length - 1 ? s + 1 : s));
    }, 1200);
    const redirect = setTimeout(() => navigate("/dashboard"), 4200);
    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-[#021c1a] to-[#041a18] text-[#a4f4d9] relative overflow-hidden">

      {/* Reaction light */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-[#7ceee0]/5 via-transparent to-[#a4f4d9]/5 pointer-events-none"
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      />

      {/* Glow nền */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full bg-[#7ceee0]/15 blur-3xl"
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      {/* Logo */}
      <motion.img
        src="/assets/bravium-logo.png"
        alt="Bravium"
        className="w-40 mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
      />

      {/* Text chuyển */}
      <motion.h1
        key={step}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="font-mono text-lg tracking-widest text-center"
      >
        {messages[step]}
      </motion.h1>

      {/* Thanh năng lượng */}
      <motion.div className="mt-10 h-[3px] w-60 bg-[#7ceee0]/20 overflow-hidden rounded-full">
        <motion.div
          className="h-full bg-gradient-to-r from-[#a4f4d9] to-[#7ceee0]"
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 3.5, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}
