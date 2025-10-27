import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy } from "lucide-react";

export default function ReferralLink({ address = "0xABCD...1234" }) {
  const [copied, setCopied] = useState(false);
  const link = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://bravium.tech";
    return `${base}/invite?ref=${encodeURIComponent(address)}`;
  }, [address]);

  return (
    <div className="flex items-center gap-2 bg-[#041a18]/70 border border-[#a4f4d9]/20 rounded-xl px-3 py-2">
      <span className="text-xs text-[#bdeee0] truncate max-w-[220px]">{link}</span>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
        className="flex items-center gap-1 bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] text-black text-xs font-semibold px-2 py-1 rounded-lg"
      >
        <Copy className="w-3 h-3" /> {copied ? "Copied" : "Copy"}
      </motion.button>
    </div>
  );
}
