export default function AIAssistantShell({
  response,
  emptyText = "Ask Bravium is now using a structured assistant shell.",
}) {
  if (!response) {
    return (
      <div className="mt-4 w-full rounded-xl border border-zinc-800 bg-[#031d1b]/80 p-4 text-sm text-[#bdeee0]/80">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="mt-4 w-full rounded-xl border border-[#a4f4d9]/20 bg-[#031d1b]/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-[#7ceee0]">
          {response.mode}
        </p>

        {(response.needs_user_attention || response.needs_user_approval) && (
          <div className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
            attention
          </div>
        )}
      </div>

      <p className="mt-3 text-sm font-semibold text-[#a4f4d9]">
        {response.summary}
      </p>

      <p className="mt-3 text-sm leading-6 text-[#d9fff4]">
        {response.answer_text}
      </p>

      {Array.isArray(response.suggested_actions) &&
      response.suggested_actions.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[#bdeee0]/60">
            Suggested actions
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {response.suggested_actions.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#a4f4d9]/20 bg-black/20 px-3 py-2 text-xs text-[#bdeee0]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 text-xs text-[#bdeee0]/50">
        context used:{" "}
        {Array.isArray(response.source_context_used)
          ? response.source_context_used.join(", ")
          : "-"}
      </div>
    </div>
  );
}
