import { motion } from "framer-motion";
import { useEffect } from "react";

export default function ConnectionBridgeFX({ show = false, onDone = () => { } }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onDone, 2500); // auto close sau 2.5s
      return () => clearTimeout(timer);
    }
  }, [show, onDone]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] flex items-center justify-center">
      {/* lớp mờ nền */}
      <motion.div
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* vòng plasma ngoài */}
      <motion.div
        className="absolute -translate-y-[150px] w-[620px] h-[620px] rounded-full border-4 border-[#7ceee0]/30 blur-3xl"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* vòng plasma trong */}
      <motion.div
        className="absolute -translate-y-[150px] w-[420px] h-[420px] rounded-full border-4 border-[#a4f4d9]/40 blur-2xl"
        animate={{ rotate: [360, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      {/* hạt năng lượng xoay quanh */}
      <motion.div
        className="absolute -translate-y-[150px] w-[640px] h-[640px] flex items-center justify-start"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-3 h-3 bg-gradient-to-tr from-[#7ceee0] to-[#a4f4d9] rounded-full shadow-[0_0_12px_#7ceee0]" />
      </motion.div>
      <motion.div
        className="absolute w-[420px] h-[420px] flex items-center justify-start"
        animate={{ rotate: [360, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-2 h-2 bg-gradient-to-tr from-[#a4f4d9] to-[#7ceee0] rounded-full shadow-[0_0_10px_#a4f4d9]" />
      </motion.div>

      {/* text thông báo */}
      <motion.div
        className="absolute bottom-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-[#a4f4d9] text-lg font-semibold tracking-wide">
          Energy Bridge Established — AI Nodes Synced
        </p>
      </motion.div>
    </div>
  );
}
