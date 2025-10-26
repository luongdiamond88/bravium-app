import { motion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";

// Voice feedback system
function speak(text, tone = "neutral") {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";

  if (tone === "happy") {
    utter.pitch = 1.3; utter.rate = 1;
  } else if (tone === "serious") {
    utter.pitch = 0.8; utter.rate = 0.9;
  } else if (tone === "calm") {
    utter.pitch = 1; utter.rate = 0.8;
  } else {
    utter.pitch = 1; utter.rate = 1;
  }

  const voices = speechSynthesis.getVoices();
  const voice = voices.find(v => v.name.toLowerCase().includes("english")) || voices[0];
  utter.voice = voice;
  speechSynthesis.speak(utter);
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const talk = (msg) => {
    const text = msg || "Hello, I'm Bravium Assistant. How can I assist you today?";
    speak(text, "calm");
  };

  const handleUserMessage = (msg) => {
    if (!msg.trim()) return;
    const newMessages = [...messages, { sender: "user", text: msg }];
    setMessages(newMessages);

    setTimeout(() => {
      const reply = "Processing your request... Energy levels stable.";
      setMessages(prev => [...prev, { sender: "ai", text: reply }]);
      speak(reply, "happy");
    }, 1000);
  };

  return (
    <>
      {/* Nút mở AI */}
      {!isOpen && (
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setIsOpen(true);
            talk();
          }}
          className="fixed bottom-6 right-6 z-50 transition-all hover:scale-105 focus:outline-none"
        >
          <img
            src="/assets/bravium-logo.png"
            alt="Bravium AI"
            className="w-16 h-16 object-contain drop-shadow-[0_0_20px_rgba(164,244,217,0.4)]"
          />
        </motion.button>
      )}

      {/* Hộp trợ lý */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-6 right-6 w-72 bg-[#041a1c]/95 border border-[#a4f4d9]/30 
          rounded-2xl shadow-[0_0_30px_rgba(164,244,217,0.2)] flex flex-col items-center p-4 z-50"
        >
          {/* Nút đóng */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-[#bdeee0] hover:text-[#a4f4d9] transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Logo */}
          <div className="w-24 h-24 mb-3">
            <img
              src="/assets/bravium-logo.png"
              alt="Bravium Robot"
              className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(164,244,217,0.3)]"
            />
          </div>

          <p className="font-semibold text-[#a4f4d9] mb-1">Bravium Assistant</p>
          <p className="text-[#bdeee0] text-center text-sm leading-relaxed mb-4">
            Hi! I'm your AI companion. I can help you monitor staking,
            explain rewards, or guide you through the dashboard.
          </p>

          {/* Nút nói */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              talk("Monitoring your staking performance. All systems stable.", "happy");
              setChatOpen(!chatOpen);
            }}
            className="bg-gradient-to-r from-[#7ceee0] to-[#a4f4d9] text-black font-semibold py-2 px-6 rounded-xl 
              hover:from-[#a4f4d9] hover:to-[#7ceee0] shadow-[0_0_20px_rgba(164,244,217,0.3)] transition-all duration-300"
          >
            {chatOpen ? "Close Chat" : "Talk to Me"}
          </motion.button>

          {/* Khung chat mini */}
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 w-full bg-[#031d1b]/80 border border-[#a4f4d9]/20 rounded-xl p-3"
            >
              <div className="h-32 overflow-y-auto text-sm mb-2 space-y-2 font-mono">
                {messages.length === 0 && (
                  <p className="text-[#bdeee0]/70 text-center italic">
                    👋 Say something to Bravium...
                  </p>
                )}
                {messages.map((m, i) => (
                  <p
                    key={i}
                    className={`${m.sender === "user"
                        ? "text-[#7ceee0] text-right"
                        : "text-[#a4f4d9] text-left"
                      }`}
                  >
                    {m.text}
                  </p>
                ))}
              </div>
              <input
                type="text"
                placeholder="Type here..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUserMessage(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="w-full bg-[#021c1a] border border-[#a4f4d9]/30 rounded-lg text-[#a4f4d9] p-2 text-sm focus:outline-none"
              />
            </motion.div>
          )}
        </motion.div>
      )}
    </>
  );
}
