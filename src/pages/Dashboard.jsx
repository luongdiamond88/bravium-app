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

// Giọng nói
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.pitch = 0.9;
  utter.rate = 1;
  const voices = speechSynthesis.getVoices();
  const male = voices.find((v) => v.name.toLowerCase().includes("male")) || voices[0];
  if (male) utter.voice = male;
  speechSynthesis.speak(utter);
}

export default function Dashboard() {
  const { darkMode, setDarkMode } = useTheme();
  const [brc, setBrc] = useState(0);
  const [isEarning, setIsEarning] = useState(false);
  const [showBridge, setShowBridge] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // detect query ?joined=1 để bật animation plasma
  useEffect(() => {
    const hash = window.location.hash;
    const query = hash.split("?")[1];
    if (query) {
      const params = new URLSearchParams(query);
      if (params.get("joined") === "1") setShowBridge(true);
    }
  }, []);

  // Hiệu ứng matrix
  useEffect(() => {
    const canvas = canvasRef.current;
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
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    const interval = setInterval(draw, isEarning ? 25 : 45);
    return () => clearInterval(interval);
  }, [isEarning]);

  // Counter tăng khi earn
  useEffect(() => {
    if (!isEarning) return;
    const interval = setInterval(() => {
      setBrc((prev) => parseFloat((prev + Math.random() * 0.0015).toFixed(4)));
    }, 900);
    return () => clearInterval(interval);
  }, [isEarning]);

  // Bắt đầu earn
  const handleStart = () => {
    setIsEarning(true);
    setBrc(0);
    speak("Earning mode activated. Energy core online.");
  };

  // Dừng earn & mở ShareModal
  const handleStop = () => {
    setIsEarning(false);
    speak(`Earning session complete. You have earned ${brc.toFixed(3)} BRC.`);
    alert(`Session complete: +${brc.toFixed(3)} BRC`);
    // ⚙️ mở modal sau 150ms để đảm bảo state đã cập nhật
    setTimeout(() => setShowShare(true), 150);
  };

  // Mở trang Stake
  const handleStake = () => {
    speak("Switching to staking protocol. Preparing to earn ETH.");
    navigate("/stake");
  };

  // Mở trang Daily Tasks
  const handleTasks = () => {
    speak("Opening your daily tasks now.");
    window.location.hash = "#/tasks";
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 ${darkMode
        ? "bg-gradient-to-b from-black via-[#021c1a] to-[#041a18] text-white"
        : "bg-gradient-to-b from-gray-100 to-white text-gray-900"
        }`}
    >
      {/* ProofCard ẩn để chụp */}
      <div className="hidden">
        <ProofCard
          username="Neo"
          amount={brc.toFixed(3)}
          token="BRC"
          address="0xABCD...1234"
        />
      </div>

      {/* Share modal */}
      <ShareModal
        open={showShare}
        onClose={() => setShowShare(false)}
        amount={brc.toFixed(3)}
        token="BRC"
      />

      {/* Toggle Dark mode */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute bottom-6 left-6 z-50 p-2 rounded-full bg-[#a4f4d9]/20 hover:bg-[#a4f4d9]/40 transition"
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Referral link */}
      <div className="absolute top-6 left-6 z-50">
        <ReferralLink address="0xABCD...1234" />
      </div>

      {/* ID Card */}
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

      {/* Matrix Energy Core */}
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

      {/* Counter */}
      <motion.h1
        key={brc}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-4xl font-bold text-[#a4f4d9] mt-8 tracking-wide"
      >
        +{brc.toFixed(3)} BRC
      </motion.h1>
      <p className="text-sm text-[#7ceee0] mt-1">≈ ${(brc * 0.08).toFixed(4)} USD</p>

      <motion.p
        className="text-xs font-mono text-[#7ceee0] mt-3"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isEarning ? "EARNING MODE ACTIVE" : "IDLE MODE"}
      </motion.p>

      {/* Các nút điều khiển */}
      <div className="flex flex-wrap justify-center gap-4 mt-10 z-10">
        {!isEarning ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
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

            {/* 🪙 Daily Tasks */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleTasks}
              className="px-8 py-3 rounded-2xl font-semibold text-black bg-gradient-to-r from-yellow-200 to-[#7ceee0] hover:from-yellow-100 hover:to-[#a4f4d9] transition-all shadow-[0_0_25px_rgba(255,255,0,0.25)]"
            >
              💰 Earn More BRC
            </motion.button>
          </>
        )}
      </div>

      {/* Plasma effect */}
      <ConnectionBridgeFX show={showBridge} onDone={() => setShowBridge(false)} />

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}
