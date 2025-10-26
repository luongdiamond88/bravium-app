import { motion } from "framer-motion";
import { useState } from "react";

export default function WalletConnect({ onConnect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  const connectWallet = (type) => {
    setTimeout(() => {
      const mockAddr =
        "0x" +
        Math.random().toString(16).substring(2, 6) +
        "..." +
        Math.random().toString(16).substring(2, 6);
      setWalletAddress(mockAddr);
      setConnected(true);
      setIsOpen(false);
      onConnect && onConnect(mockAddr);
    }, 1500);
  };

  const disconnect = () => {
    setConnected(false);
    setWalletAddress("");
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {!connected ? (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] text-black font-semibold py-2 px-6 rounded-xl 
                     shadow-[0_0_20px_rgba(164,244,217,0.4)] hover:from-[#a4f4d9] hover:to-[#7ceee0] 
                     transition-all duration-300"
        >
          Connect Wallet
        </motion.button>
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-sm text-[#bdeee0] mb-2 font-mono">
            Connected:{" "}
            <span className="text-[#a4f4d9] font-semibold">{walletAddress}</span>
          </p>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={disconnect}
            className="bg-gradient-to-r from-[#ff7070] to-[#ff9b9b] text-white text-sm py-1 px-4 rounded-lg 
                       hover:from-[#ff5c5c] transition-all duration-300"
          >
            Disconnect
          </motion.button>
        </div>
      )}

      {/* Modal chọn ví */}
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-gradient-to-b from-[#031d1b] via-[#041a18] to-[#031d1b] 
                       p-6 rounded-2xl shadow-[0_0_40px_rgba(164,244,217,0.2)] 
                       text-center border border-[#a4f4d9]/30 max-w-xs w-full"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
          >
            <h2 className="text-lg font-bold text-[#a4f4d9] mb-4">
              Select Wallet
            </h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => connectWallet("metamask")}
                className="py-2 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 
                           text-white font-semibold shadow-[0_0_15px_rgba(255,165,0,0.3)] 
                           hover:from-orange-300 hover:to-orange-400 transition-all"
              >
                🦊 MetaMask
              </button>
              <button
                onClick={() => connectWallet("walletconnect")}
                className="py-2 rounded-lg bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] 
                           text-black font-semibold shadow-[0_0_15px_rgba(124,238,224,0.4)] 
                           hover:from-[#a4f4d9] hover:to-[#7ceee0] transition-all"
              >
                🌐 WalletConnect
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-3 text-sm text-[#bdeee0] hover:text-[#a4f4d9] transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
