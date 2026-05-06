import type { CreateEventInput } from "./events.schema";
import { createEventLog, getEventsBySessionId } from "./events.repo";

function inferCategory(type: string): string {
  if (
    [
      "first_power_on_confirmed",
      "ai_activation_confirmed",
      "first_brc_mining_confirmed",
      "brc_to_eth_transfer_confirmed",
      "eth_yield_update_confirmed",
      "eth_claim_confirmed",
      "first_history_record_confirmed",
      "first_economic_cycle_confirmed",
    ].includes(type)
  ) {
    return "checkpoint";
  }

  if (
    [
      "ai_job_created",
      "ai_analysis_started",
      "ai_analysis_completed",
      "ai_reply_generated",
      "ai_alert_generated",
    ].includes(type)
  ) {
    return "ai";
  }

  if (
    [
      "user_approval_requested",
      "user_approved",
      "user_rejected",
      "action_blocked",
      "action_executed",
      "ai_paused",
      "manual_override_triggered",
    ].includes(type)
  ) {
    return "control";
  }

  if (
    [
      "expense_parsed",
      "expense_saved",
      "reminder_scheduled",
      "budget_alert_generated",
    ].includes(type)
  ) {
    return "finance";
  }

  if (
    [
      "physical_confirm_requested",
      "physical_confirm_received",
      "physical_confirm_failed",
    ].includes(type)
  ) {
    return "device";
  }

  return "unknown";
}

export async function createEventService(input: CreateEventInput) {
  const category = input.category ?? inferCategory(input.type);

  return createEventLog({
    ...input,
    category,
  });
}

export async function getEventsBySessionIdService(sessionId: string) {
  return getEventsBySessionId(sessionId);
}
