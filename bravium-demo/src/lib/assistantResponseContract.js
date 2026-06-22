export function createAssistantResponse({
  mode,
  summary,
  answerText,
  suggestedActions = [],
  needsUserAttention = false,
  needsUserApproval = false,
  sourceContextUsed = [],
  logsToEmit = [],
}) {
  return {
    mode,
    summary,
    answer_text: answerText,
    suggested_actions: suggestedActions,
    needs_user_attention: needsUserAttention,
    needs_user_approval: needsUserApproval,
    source_context_used: sourceContextUsed,
    logs_to_emit: logsToEmit,
  };
}