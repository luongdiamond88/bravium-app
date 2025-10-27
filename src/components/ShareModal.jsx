import { motion } from "framer-motion";
import { useState } from "react";
import useScreenshot from "../hooks/useScreenshot";
import ProofCard from "./ProofCard";
import ProofCardETH from "./ProofCardETH";

export default function ShareModal({ open, onClose, amount, token }) {
  const { capture, loading } = useScreenshot();
  const [image, setImage] = useState(null);

  if (!open) return null;

  // 📸 Chụp card hiện tại
  const handleCapture = async () => {
    try {
      const dataUrl = await capture("proof-card");
      setImage(dataUrl);
      console.log("✅ Capture OK!");
    } catch (err) {
      console.error("❌ Capture error:", err);
      alert("Không thể chụp hình — kiểm tra console để xem chi tiết.");
    }
  };

  // 💾 Tải ảnh về
  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = image;
    a.download = "bravium-proof.png";
    a.click();
  };

  // 🐦 Chia sẻ lên Twitter (X)
  const shareTweet = () => {
    const text = encodeURIComponent(
      `Just earned ${amount} ${token} with my Bravium AI Node ⚡ #Bravium #RealYield`
    );
    const url = encodeURIComponent("https://bravium.tech");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 z-[999] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Hidden Proof Card để html2canvas chụp */}
      <div
        key={`proof-${token}-${amount}`} // ✅ ép React tạo DOM mới mỗi lần amount đổi
        id="capture-container"
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          opacity: 1,
        }}
      >
        {token === "ETH" ? (
          <ProofCardETH
            username="Neo"
            amount={amount}
            token="ETH"
            address="0xABCD...1234"
          />
        ) : (
          <ProofCard
            username="Neo"
            amount={amount}
            token="BRC"
            address="0xABCD...1234"
          />
        )}
      </div>

      {/* Giao diện Modal */}
      <div className="bg-[#041a18]/90 border border-[#a4f4d9]/30 p-6 rounded-2xl text-center w-[700px] backdrop-blur-md shadow-lg">
        {!image ? (
          <>
            <p className="text-[#a4f4d9] mb-4 text-lg font-semibold">
              Share your Proof of Earn
            </p>
            <button
              onClick={handleCapture}
              disabled={loading}
              className="bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] text-black font-semibold px-6 py-2 rounded-xl hover:brightness-110"
            >
              {loading ? "Generating..." : "📸 Generate Card"}
            </button>
          </>
        ) : (
          <>
            <img
              src={image}
              alt="Proof"
              className="rounded-2xl shadow-lg mx-auto mb-4 border border-[#a4f4d9]/20"
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={handleDownload}
                className="bg-[#7ceee0]/20 border border-[#a4f4d9]/30 px-4 py-2 rounded-lg text-[#a4f4d9] hover:bg-[#7ceee0]/30 transition"
              >
                Download
              </button>
              <button
                onClick={shareTweet}
                className="bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] text-black font-semibold px-4 py-2 rounded-lg hover:brightness-110"
              >
                Share to X
              </button>
              <button
                onClick={() => {
                  setImage(null);
                  onClose();
                }}
                className="bg-[#041a18] border border-[#a4f4d9]/20 text-[#bdeee0] px-4 py-2 rounded-lg hover:bg-[#0a2a27]/70 transition"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
