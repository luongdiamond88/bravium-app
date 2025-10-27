import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/DailyTasks";
import Stake from "./pages/Stake";
import AI from "./components/AIAssistant";
import Earn from "./pages/PowerOn";
import { useTheme } from "./context/ThemeContext";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/stake" element={<Stake />} />
        <Route path="/ai" element={<AI />} />
        <Route path="/earn" element={<Earn />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  const { theme } = useTheme();

  return (
    <motion.div
      className={`min-h-screen ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      } transition-all duration-500`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatedRoutes />
    </motion.div>
  );
}
