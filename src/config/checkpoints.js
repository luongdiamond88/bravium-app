const STORAGE_KEY = "bravium-checkpoints";

export const EVENT_TYPES = {
  FIRST_POWER_ON_CONFIRMED: "first_power_on_confirmed",
  AI_ACTIVATION_CONFIRMED: "ai_activation_confirmed",
  FIRST_BRC_MINING_CONFIRMED: "first_brc_mining_confirmed",
  BRC_TO_ETH_TRANSFER_CONFIRMED: "brc_to_eth_transfer_confirmed",
  ETH_YIELD_UPDATE_CONFIRMED: "eth_yield_update_confirmed",
  ETH_CLAIM_CONFIRMED: "eth_claim_confirmed",
  FIRST_HISTORY_RECORD_CONFIRMED: "first_history_record_confirmed",
  FIRST_ECONOMIC_CYCLE_CONFIRMED: "first_economic_cycle_confirmed",
  AI_PAUSED: "ai_paused",
  MANUAL_OVERRIDE_TRIGGERED: "manual_override_triggered",
};

const defaultState = {
  powerOn: {
    firstConfirmedOnce: false,
  },
  dashboard: {
    startConfirmedOnce: false,
    firstBrcMiningConfirmedOnce: false,
    firstHistoryRecordConfirmedOnce: false,
  },
  stake: {
    startConfirmedOnce: false,
    yieldUpdateConfirmedOnce: false,
    claimConfirmedOnce: false,
    firstEconomicCycleCompletedOnce: false,
    firstHistoryRecordConfirmedOnce: false,
  },
  session: {
    sessionId: null,
    aiActivationConfirmed: false,
    isPaused: false,
    manualOverrideTriggered: false,
  },
  eventLog: [],
};

function emitCheckpointUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("bravium-checkpoints-updated"));
  }
}

function buildSafeState(parsed = {}) {
  return {
    ...defaultState,
    ...parsed,
    powerOn: {
      ...defaultState.powerOn,
      ...(parsed.powerOn || {}),
    },
    dashboard: {
      ...defaultState.dashboard,
      ...(parsed.dashboard || {}),
    },
    stake: {
      ...defaultState.stake,
      ...(parsed.stake || {}),
    },
    session: {
      ...defaultState.session,
      ...(parsed.session || {}),
    },
    eventLog: Array.isArray(parsed.eventLog) ? parsed.eventLog : [],
  };
}

export function getCheckpointState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSafeState();

    const parsed = JSON.parse(raw);
    return buildSafeState(parsed);
  } catch {
    return buildSafeState();
  }
}

export function clearCheckpointEventLog() {
  const current = getCheckpointState();

  const next = {
    ...current,
    eventLog: [],
  };

  setCheckpointState(next);
  return next;
}

export function setCheckpointState(nextState) {
  const safeState = buildSafeState(nextState);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safeState));
  emitCheckpointUpdate();
}

export function resetCheckpointState() {
  setCheckpointState(defaultState);
}

export function appendCheckpointEvent(type, payload = {}, source = "system") {
  const current = getCheckpointState();

  const event = {
    type,
    at: new Date().toISOString(),
    source,
    sessionId: current.session.sessionId || null,
    payload,
  };

  const next = {
    ...current,
    eventLog: [...current.eventLog, event],
  };

  setCheckpointState(next);
  return next;
}

/* =========================
   Session helpers
========================= */

export function startNewSession(source = "system") {
  const current = getCheckpointState();

  const next = {
    ...current,
    session: {
      sessionId: `session_${Date.now()}`,
      aiActivationConfirmed: false,
      isPaused: false,
      manualOverrideTriggered: false,
    },
  };

  setCheckpointState(next);
  return next;
}

export function getCurrentSession() {
  return getCheckpointState().session;
}

export function confirmAiActivation(payload = {}, source = "dashboard") {
  const current = getCheckpointState();

  const next = {
    ...current,
    session: {
      ...current.session,
      aiActivationConfirmed: true,
      isPaused: false,
    },
  };

  setCheckpointState(next);
  appendCheckpointEvent(EVENT_TYPES.AI_ACTIVATION_CONFIRMED, payload, source);
  return next;
}

export function pauseAi(payload = {}, source = "system") {
  const current = getCheckpointState();

  const next = {
    ...current,
    session: {
      ...current.session,
      isPaused: true,
    },
  };

  setCheckpointState(next);
  appendCheckpointEvent(EVENT_TYPES.AI_PAUSED, payload, source);
  return next;
}

export function resumeAi() {
  const current = getCheckpointState();

  const next = {
    ...current,
    session: {
      ...current.session,
      isPaused: false,
    },
  };

  setCheckpointState(next);
  return next;
}

export function triggerManualOverride(payload = {}, source = "system") {
  const current = getCheckpointState();

  const next = {
    ...current,
    session: {
      ...current.session,
      manualOverrideTriggered: true,
      isPaused: true,
    },
  };

  setCheckpointState(next);
  appendCheckpointEvent(EVENT_TYPES.MANUAL_OVERRIDE_TRIGGERED, payload, source);
  return next;
}

/* =========================
   Event log helpers
========================= */
export function logFirstPowerOn(payload = {}, source = "powerOn") {
  return appendCheckpointEvent(
    EVENT_TYPES.FIRST_POWER_ON_CONFIRMED,
    payload,
    source,
  );
}

export function logFirstBrcMining(payload = {}, source = "dashboard") {
  return appendCheckpointEvent(
    EVENT_TYPES.FIRST_BRC_MINING_CONFIRMED,
    payload,
    source,
  );
}

export function logStakeTransfer(payload = {}, source = "stake") {
  return appendCheckpointEvent(
    EVENT_TYPES.BRC_TO_ETH_TRANSFER_CONFIRMED,
    payload,
    source,
  );
}

export function logEthClaim(payload = {}, source = "stake") {
  return appendCheckpointEvent(
    EVENT_TYPES.ETH_CLAIM_CONFIRMED,
    payload,
    source,
  );
}

export function logFirstEconomicCycle(payload = {}, source = "stake") {
  return appendCheckpointEvent(
    EVENT_TYPES.FIRST_ECONOMIC_CYCLE_CONFIRMED,
    payload,
    source,
  );
}

export function logEthYieldUpdate(payload = {}, source = "stake") {
  return appendCheckpointEvent(
    EVENT_TYPES.ETH_YIELD_UPDATE_CONFIRMED,
    payload,
    source,
  );
}

export function logFirstHistoryRecord(payload = {}, source = "dashboard") {
  return appendCheckpointEvent(
    EVENT_TYPES.FIRST_HISTORY_RECORD_CONFIRMED,
    payload,
    source,
  );
}

export function getCheckpointEventLog() {
  return getCheckpointState().eventLog;
}

/* =========================
   Backward-compatible old helpers
========================= */

export function hasDashboardStartConfirmedOnce() {
  return getCheckpointState().dashboard.startConfirmedOnce;
}

export function markDashboardStartConfirmedOnce() {
  const current = getCheckpointState();

  const next = {
    ...current,
    dashboard: {
      ...current.dashboard,
      startConfirmedOnce: true,
    },
  };

  setCheckpointState(next);
  return next;
}

export function hasStakeStartConfirmedOnce() {
  return getCheckpointState().stake.startConfirmedOnce;
}

export function markStakeStartConfirmedOnce() {
  const current = getCheckpointState();

  const next = {
    ...current,
    stake: {
      ...current.stake,
      startConfirmedOnce: true,
    },
  };

  setCheckpointState(next);
  return next;
}

export function hasStakeYieldUpdateConfirmedOnce() {
  return getCheckpointState().stake.yieldUpdateConfirmedOnce;
}

export function markStakeYieldUpdateConfirmedOnce() {
  const current = getCheckpointState();

  const next = {
    ...current,
    stake: {
      ...current.stake,
      yieldUpdateConfirmedOnce: true,
    },
  };

  setCheckpointState(next);
  return next;
}

export function hasStakeClaimConfirmedOnce() {
  return getCheckpointState().stake.claimConfirmedOnce;
}

export function markStakeClaimConfirmedOnce() {
  const current = getCheckpointState();

  const next = {
    ...current,
    stake: {
      ...current.stake,
      claimConfirmedOnce: true,
    },
  };

  setCheckpointState(next);
  return next;
}

export function hasFirstEconomicCycleCompletedOnce() {
  return getCheckpointState().stake.firstEconomicCycleCompletedOnce;
}

export function markFirstEconomicCycleCompletedOnce() {
  const current = getCheckpointState();

  const next = {
    ...current,
    stake: {
      ...current.stake,
      firstEconomicCycleCompletedOnce: true,
    },
  };

  setCheckpointState(next);
  return next;
}

export function hasFirstPowerOnConfirmedOnce() {
  return getCheckpointState().powerOn.firstConfirmedOnce;
}

export function markFirstPowerOnConfirmedOnce() {
  const current = getCheckpointState();

  const next = {
    ...current,
    powerOn: {
      ...current.powerOn,
      firstConfirmedOnce: true,
    },
  };

  setCheckpointState(next);
  return next;
}

export function hasFirstBrcMiningConfirmedOnce() {
  return getCheckpointState().dashboard.firstBrcMiningConfirmedOnce;
}

export function markFirstBrcMiningConfirmedOnce() {
  const current = getCheckpointState();

  const next = {
    ...current,
    dashboard: {
      ...current.dashboard,
      firstBrcMiningConfirmedOnce: true,
    },
  };

  setCheckpointState(next);
  return next;
}

export function hasFirstHistoryRecordConfirmedOnce() {
  const state = getCheckpointState();

  return Boolean(
    state.dashboard?.firstHistoryRecordConfirmedOnce ||
      state.stake?.firstHistoryRecordConfirmedOnce,
  );
}

export function markFirstHistoryRecordConfirmedOnce() {
  const current = getCheckpointState();

  const next = {
    ...current,
    dashboard: {
      ...current.dashboard,
      firstHistoryRecordConfirmedOnce: true,
    },
  };

  setCheckpointState(next);
  return next;
}
