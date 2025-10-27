import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function BraviumIDCard({
  username = "Neo",
  address = "0xABCD...1234",
  rank = "Node",
  streak = 7,
  energy = 2450,
  totalEarn = "0.123 ETH",
  avatar = "/assets/bravium-logo.png"
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="group relative w-64 bg-[#041a18]/80 border border-[#a4f4d9]/30 rounded-2xl p-4 shadow-[0_0_20px_rgba(164,244,217,0.2)]"
    >
      <div className="flex items-center gap-3">
        <img src={avatar} alt="avatar" className="w-10 h-10 rounded-xl object-contain" />
        <div className="truncate">
          <p className="text-[#a4f4d9] font-semibold">{username}</p>
          <p className="text-[#bdeee0] text-xs">{address}</p>
        </div>
        <span className="ml-auto text-xs bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] text-black px-2 py-1 rounded-lg font-semibold">{rank}</span>
      </div>

      {/* hover stats */}
      <div className="absolute left-0 right-0 top-full mt-2 opacity-0 group-hover:opacity-100 transition">
        <div className="bg-[#031d1b]/90 border border-[#a4f4d9]/20 rounded-xl p-3 text-xs">
          <div className="flex items-center justify-between text-[#bdeee0]">
            <span>Streak</span><span className="text-[#7ceee0] font-semibold">{streak} days</span>
          </div>
          <div className="flex items-center justify-between text-[#bdeee0]">
            <span>Energy</span><span className="text-[#7ceee0] font-semibold">{energy} BRC</span>
          </div>
          <div className="flex items-center justify-between text-[#bdeee0]">
            <span>Total Earn</span><span className="text-[#7ceee0] font-semibold">{totalEarn}</span>
          </div>
        </div>
      </div>

      <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-[#a4f4d9]" />
    </motion.div>
  );
}
