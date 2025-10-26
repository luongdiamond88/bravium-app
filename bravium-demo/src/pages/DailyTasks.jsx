import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Share2, UserPlus, Settings, ArrowLeft } from "lucide-react";
import { SiEthereum } from "react-icons/si";
import AIAssistant from "../components/AIAssistant";
import { useNavigate } from "react-router-dom";

export default function DailyTasks() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([
    { id: 1, title: "Check in", reward: 5, done: true, icon: <CheckCircle className="w-5 h-5 text-[#a4f4d9]" /> },
    { id: 2, title: "Invite 1 friend", reward: 20, done: true, icon: <UserPlus className="w-5 h-5 text-[#a4f4d9]" /> },
    { id: 3, title: "Stake additional 0.1 ETH", reward: 15, done: false, icon: <SiEthereum className="w-5 h-5 text-[#a4f4d9]" /> },
    { id: 4, title: "Share Bravium", reward: 10, done: false, icon: <Share2 className="w-5 h-5 text-[#a4f4d9]" /> },
    { id: 5, title: "Complete all daily tasks", reward: 25, done: false, icon: <CheckCircle className="w-5 h-5 text-[#a4f4d9]" /> },
  ]);

  const [showReward, setShowReward] = useState(false);
  const [bonus, setBonus] = useState(0);
  const [flyReward, setFlyReward] = useState(false);
  const energyParticles = Array.from({ length: 9 });
  const completed = tasks.filter(t => t.done).length;
  const totalReward = tasks.filter(t => t.done).reduce((sum, t) => sum + t.reward, 0);

  const toggleTask = (id) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTasks(updated);

    const allDone = updated.every((t) => t.done);
    if (allDone && !showReward) {
      setBonus(50);
      setShowReward(true);
      setFlyReward(true);

      setTimeout(() => setShowReward(false), 3000);
      setTimeout(() => setFlyReward(false), 2000);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-black via-[#021c1a] to-[#041a18] text-[#a4f4d9] flex flex-col items-center justify-start pt-12 relative overflow-hidden px-6">
        {/* Hiệu ứng nền ánh sáng */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full bg-[#7ceee0]/10 blur-3xl top-[-150px] left-1/2 -translate-x-1/2"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        {/* Header */}
        <div className="w-full max-w-md flex justify-center items-center mb-6 z-10 relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/dashboard")}
            className="absolute left-0 flex items-center gap-1 text-[#a4f4d9] hover:text-[#7ceee0] transition text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </motion.button>

          <h1 className="text-2xl font-bold tracking-wide text-[#a4f4d9] drop-shadow-[0_0_10px_rgba(164,244,217,0.5)]">DAILY TASKS</h1>

          <button className="absolute right-0 p-2 bg-[#a4f4d9]/10 rounded-lg hover:bg-[#a4f4d9]/20 transition">
            <Settings className="w-5 h-5 text-[#a4f4d9]" />
          </button>
        </div>

        {/* Danh sách nhiệm vụ */}
        <div className="w-full max-w-md space-y-3 z-10">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleTask(task.id)}
              className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer border ${task.done
                  ? "bg-[#0c2b27]/80 border-[#a4f4d9]/40 shadow-[0_0_15px_rgba(164,244,217,0.15)]"
                  : "bg-[#031a18]/80 border-[#a4f4d9]/10 hover:bg-[#0c2b27]/80"
                }`}
            >
              <div className="flex items-center gap-3">
                {task.icon}
                <span
                  className={`text-base font-medium ${task.done ? "text-[#a4f4d9]/60 line-through" : "text-[#a4f4d9]"
                    }`}
                >
                  {task.title}
                </span>
              </div>
              <span className="font-semibold text-[#7ceee0]">+ {task.reward} BRC</span>
            </motion.div>
          ))}
        </div>

        {/* Thanh tiến độ */}
        <div className="w-full max-w-md mt-6 z-10">
          <p className="text-sm mb-2 text-[#bdeee0]">
            {completed} / {tasks.length} tasks completed
          </p>
          <div className="w-full h-2 bg-[#a4f4d9]/10 rounded-full overflow-hidden">
            <motion.div
              className="h-2 bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completed / tasks.length) * 100}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>

        {/* Tổng kết */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-8 text-center text-base z-10"
        >
          <span role="img" aria-label="party">🎉</span>{" "}
          You’ve earned{" "}
          <span className="font-semibold text-[#7ceee0]">
            {totalReward + bonus} BRC
          </span>{" "}
          today!
        </motion.div>

        <AIAssistant />
      </div>

      {/* ✅ Hiệu ứng Claim Reward */}
      {showReward && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.8 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [40, -40, -80],
            scale: [0.8, 1.2, 1],
          }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="fixed bottom-1/2 left-1/2 -translate-x-1/2 text-center z-[999]"
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 blur-2xl bg-gradient-to-tr from-[#7ceee0]/30 to-[#a4f4d9]/30 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <p className="relative text-3xl font-bold text-[#a4f4d9] drop-shadow-[0_0_10px_rgba(164,244,217,0.6)]">
              🎉 +{bonus} BRC Claimed!
            </p>
          </div>
        </motion.div>
      )}

      {/* ⚡ Hiệu ứng BRC bay về robot */}
      {flyReward &&
        energyParticles.map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [0, 180 + i * 15],
              y: [0, 300 + i * 20],
              scale: [1, 0.4],
            }}
            transition={{ duration: 2 + i * 0.9, ease: "easeInOut" }}
            className="fixed bottom-1/2 left-1/2 -translate-x-1/2 z-[998] pointer-events-none"
          >
            <motion.div
              className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#7ceee0] to-[#a4f4d9] shadow-[0_0_25px_rgba(164,244,217,0.8)]"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.8, 1, 0.8],
                rotate: [0, 360],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        ))}
    </>
  );
}
