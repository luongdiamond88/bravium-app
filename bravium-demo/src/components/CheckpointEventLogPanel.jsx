import { useEffect, useState } from "react";
import {
  getCheckpointEventLog,
  getCurrentSession,
  clearCheckpointEventLog,
} from "../config/checkpoints";

export default function CheckpointEventLogPanel() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [session, setSession] = useState(null);

  const refresh = () => {
    setEvents(getCheckpointEventLog().slice().reverse());
    setSession(getCurrentSession());
  };

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    window.addEventListener("bravium-checkpoints-updated", handleUpdate);

    return () => {
      window.removeEventListener("bravium-checkpoints-updated", handleUpdate);
    };
  }, []);

  return (
    <div className="fixed top-20 left-6 z-[95]">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl border border-[#a4f4d9]/30 bg-black/70 px-4 py-2 text-sm font-semibold text-[#a4f4d9] backdrop-blur-md transition hover:bg-black/85"
        >
          Event Log ({events.length})
        </button>
      ) : (
        <div className="w-[360px] max-w-[90vw] rounded-2xl border border-[#a4f4d9]/20 bg-[#031311]/95 p-4 text-white shadow-[0_0_30px_rgba(124,238,224,0.12)] backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
                Bravium Debug
              </p>
              <h3 className="text-sm font-semibold text-white">
                Checkpoint Event Log
              </h3>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-white/5"
            >
              Close
            </button>
          </div>

          <div className="mb-3 rounded-xl border border-[#a4f4d9]/15 bg-black/20 p-3 text-xs">
            <p className="text-zinc-400">Session ID</p>
            <p className="mt-1 break-all font-mono text-[#a4f4d9]">
              {session?.sessionId || "No active session"}
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-black/20 p-2">
                <p className="text-[10px] uppercase text-zinc-400">AI Active</p>
                <p className="mt-1 font-semibold text-white">
                  {session?.aiActivationConfirmed ? "Yes" : "No"}
                </p>
              </div>

              <div className="rounded-lg bg-black/20 p-2">
                <p className="text-[10px] uppercase text-zinc-400">Paused</p>
                <p className="mt-1 font-semibold text-white">
                  {session?.isPaused ? "Yes" : "No"}
                </p>
              </div>

              <div className="rounded-lg bg-black/20 p-2">
                <p className="text-[10px] uppercase text-zinc-400">Override</p>
                <p className="mt-1 font-semibold text-white">
                  {session?.manualOverrideTriggered ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              Total events: <span className="text-white">{events.length}</span>
            </p>

            <button
              onClick={() => {
                clearCheckpointEventLog();
                refresh();
              }}
              className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
            >
              Clear Log
            </button>
          </div>

          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-black/20 p-3 text-sm text-zinc-400">
                No checkpoint events yet.
              </div>
            ) : (
              events.map((event, index) => (
                <div
                  key={`${event.at}-${index}`}
                  className="rounded-xl border border-zinc-800 bg-black/20 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-semibold text-[#a4f4d9]">
                      {event.type}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {new Date(event.at).toLocaleTimeString()}
                    </p>
                  </div>

                  <p className="mt-1 text-[11px] text-zinc-400">
                    source: {event.source}
                  </p>

                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-black/30 p-2 text-[11px] text-zinc-300">
                    {JSON.stringify(event.payload || {}, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
