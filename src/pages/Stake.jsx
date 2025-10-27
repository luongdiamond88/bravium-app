import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WalletConnect from "../components/WalletConnect";
import AIAssistant from "../components/AIAssistant";
import ShareModal from "../components/ShareModal";
import ProofCardETH from "../components/ProofCardETH";

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.pitch = 0.9;
  utter.rate = 1;
  const voices = speechSynthesis.getVoices();
  const male = voices.find(v => v.name.toLowerCase().includes("male")) || voices[0];
  if (male) utter.voice = male;
  speechSynthesis.speak(utter);
}

export default function Stake() {
  const [stakeAmount, setStakeAmount] = useState("");
  const [earning, setEarning] = useState(0);
  const [isEarning, setIsEarning] = useState(false);
  const [resultEth, setResultEth] = useState(null);
  const navigate = useNavigate();
  const [showShare, setShowShare] = useState(false);
  const [earnedEth, setEarnedEth] = useState(0);

  const APR = 18;
  const ETH_PRICE = 4900;

  const handleStake = () => {
    if (!stakeAmount || isNaN(stakeAmount) || stakeAmount <= 0) return;
    setEarning(0);
    setIsEarning(true);
    setResultEth(null);
    setEarnedEth(0); // reset earnedEth về 0 ban đầu
  };

  useEffect(() => {
    if (!isEarning) return;
    const principal = parseFloat(stakeAmount);
    const yearlyRate = APR / 100;
    const ethPerSec = (principal * yearlyRate) / (365 * 24 * 3600);

    const interval = setInterval(() => {
      setEarning(prev => parseFloat((prev + ethPerSec).toFixed(8)));
    }, 1000);
    return () => clearInterval(interval);
  }, [isEarning, stakeAmount]);

  useEffect(() => {
    if (isEarning) speak("Staking activated. Monitoring your ETH yield in real time.");
  }, [isEarning]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white bg-gradient-to-b from-black via-[#021c1a] to-[#041a18] relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,238,224,0.04),rgba(0,0,0,0.9))]"
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <div className="z-10 text-center p-6 bg-[#062e2a]/80 rounded-2xl shadow-[0_0_40px_rgba(124,238,224,0.15)] max-w-md w-full border border-[#a4f4d9]/30">

        {/* Trạng thái 1: Chưa stake */}
        {!isEarning && resultEth === null && (
          <>
            <h1 className="text-2xl font-bold text-[#a4f4d9] mb-2">Stake BRC → Earn ETH</h1>
            <p className="text-sm text-[#bdeee0] mb-6">
              Current APR:{" "}
              <span className="text-purple-400 font-semibold">{APR}% / year</span>
            </p>

            {/* Connect Wallet before staking */}
            <div className="flex justify-center mb-4">
              <WalletConnect />
            </div>

            <input
              type="number"
              value={stakeAmount}
              onChange={e => setStakeAmount(e.target.value)}
              placeholder="Enter BRC amount"
              className="w-full p-3 rounded-lg text-black font-semibold mb-4 focus:outline-none"
            />

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleStake}
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
                  animate={{ y: [0, -10, 0], scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
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

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setIsEarning(false);
                setResultEth(earning);
                setEarnedEth(earning); // ✅ lưu số ETH Earn được
                // CHỈNH: đợi state cập nhật rồi mới mở modal
                setTimeout(() => setShowShare(true), 150);
                setShowShare(true);    // ✅ mở modal share
                speak(`Staking complete. You earned ${earning.toFixed(5)} ETH.`);
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
            <h1 className="text-2xl font-bold text-[#a4f4d9] mb-3">✅ Earning Stopped</h1>
            <p className="text-lg text-[#7ceee0]">
              You’ve Earned: <span className="font-semibold">+{resultEth.toFixed(5)} ETH</span>
            </p>
            <p className="text-[#bdeee0] mb-6">
              ≈ ${(resultEth * ETH_PRICE).toFixed(2)} USD
            </p>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setResultEth(null);
                setStakeAmount("");
              }}
              className="bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] text-black font-semibold py-2 px-6 rounded-xl hover:from-[#a4f4d9] hover:to-[#7ceee0] transition-all"
            >
              Stake Again
            </motion.button>
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
        amount={earnedEth.toFixed(3)}  // số ETH thật
        token="ETH"
      />

      {/* AI Assistant hoặc hiệu ứng khác */}
      <AIAssistant />
    </div>
  );
}
