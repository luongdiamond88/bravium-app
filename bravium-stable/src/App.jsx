import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";

import PowerOn from "./pages/PowerOn";
import Dashboard from "./pages/Dashboard";
import Stake from "./pages/Stake";
import DailyTasks from "./pages/DailyTasks";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <PowerOn />
            </motion.div>
          }
        />
        <Route
          path="/dashboard"
          element={
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5 }}
            >
              <Dashboard />
            </motion.div>
          }
        />
        <Route
          path="/stake"
          element={
            <motion.div
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.8 }}
            >
              <Stake />
            </motion.div>
          }
        />
        <Route
          path="/tasks"
          element={
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              <DailyTasks />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [pulse, setPulse] = useState(false);

  // Hiệu ứng phản ứng ánh sáng khi click
  useEffect(() => {
    const handleClick = () => {
      setPulse(true);
      setTimeout(() => setPulse(false), 400);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Sự kiện beforeinstallprompt (để hiển thị nút "Install App")
  useEffect(() => {
    let deferred;
    const onBeforeInstall = (e) => {
      e.preventDefault();
      deferred = e;
      window.__showInstall = () => deferred.prompt();
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  return (
    <Router>
      {/* Hiệu ứng ánh sáng toàn app */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-[#7ceee0]/5 via-transparent to-[#a4f4d9]/5 pointer-events-none z-[1]"
        animate={{ opacity: pulse ? [0, 0.8, 0] : 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* Bao khung an toàn cho toàn bộ màn hình */}
      <div className="safe-screen">
        <AnimatedRoutes />
      </div>
    </Router>
  );
}
