import { Mic, MicOff, Square } from "lucide-react";

export default function VoiceInputButton({
  status,
  supported,
  onStart,
  onStop,
}) {
  const isListening = status === "listening";
  const isTranscribing = status === "transcribing";

  const busy = isTranscribing;

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      disabled={!supported || busy}
      title={
        !supported
          ? "Voice recognition unavailable"
          : isListening
            ? "Stop listening"
            : "Speak to fill input"
      }
      aria-label={isListening ? "Stop voice input" : "Start voice input"}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
        isListening
          ? "border-red-400/50 bg-red-500/20 text-red-300"
          : busy
            ? "cursor-wait border-zinc-700 bg-zinc-900 text-zinc-500"
            : !supported
              ? "cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-600"
              : "border-[#a4f4d9]/30 bg-[#021c1a] text-[#a4f4d9] hover:bg-[#a4f4d9]/10"
      }`}
    >
      {!supported ? (
        <MicOff size={18} />
      ) : isListening ? (
        <Square size={16} />
      ) : (
        <Mic size={18} />
      )}
    </button>
  );
}  
