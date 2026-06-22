import { AiJobType, AiOutputType } from "@prisma/client";
import type { AiReplyInput, AiScamAlertInput } from "./ai.schema";
import {
  createAiEventLog,
  createAiJob,
  createAiOutput,
  getLatestAlertOutputForSession,
  getPendingApprovalsForSession,
  getRecentEventsForSession,
  markAiJobCompleted,
  markAiJobFailed,
  markAiJobRunning,
} from "./ai.repo";
import {
  analyzeScamAlertWithApi,
  withScamAlertAliases,
} from "../../lib/aiOrchestrator";
import { classifyScamAlertRoute } from "./scamAlertRouter";
import type { ScamAlertRouteDecision } from "./scamAlertTypes";

function buildReplyOutput(input: AiReplyInput) {
  const message = input.message.trim();

  return {
    title: "General AI Reply",
    answer: `Draft reply: I reviewed your request and generated a response based on the current context. Original message: "${message}"`,
    bullets: [],
    confidence: "medium",
    requiresApproval: true,
    contextKeys: Object.keys(input.context || {}),
  };
}

function formatApprovalActionType(actionType: string) {
  switch (actionType) {
    case "continue_after_high_risk":
      return "Continue after a high-risk scam alert";
    case "claim_eth":
      return "Claim ETH";
    default:
      return actionType.replaceAll("_", " ");
  }
}

async function buildControlAssistantReply(input: AiReplyInput) {
  const recentEvents = await getRecentEventsForSession({
    userId: input.userId,
    sessionId: input.sessionId,
    limit: 40,
  });

  const pendingApprovals = await getPendingApprovalsForSession({
    userId: input.userId,
    sessionId: input.sessionId,
  });

  const latestAlert = await getLatestAlertOutputForSession({
    userId: input.userId,
    sessionId: input.sessionId,
  });

  const latestAlertContent =
    latestAlert?.content && typeof latestAlert.content === "object"
      ? (latestAlert.content as Record<string, unknown>)
      : null;

  switch (input.questionKey) {
    case "WHY_WARNED": {
      const summary = String(
        latestAlertContent?.summary || "No alert summary found.",
      );
      const redFlags = Array.isArray(latestAlertContent?.redFlags)
        ? (latestAlertContent?.redFlags as string[])
        : [];
      const riskLevel = String(latestAlertContent?.riskLevel || "unknown");

      return {
        title: "Why you were warned",
        answer:
          riskLevel === "unknown"
            ? "I could not find a current alert result for this session."
            : `This session was warned because the latest scam analysis returned ${riskLevel} risk.`,
        bullets:
          redFlags.length > 0
            ? redFlags.slice(0, 4)
            : summary !== "No alert summary found."
              ? [summary]
              : ["No red flags were found in the current session context."],
        confidence: latestAlert ? "high" : "low",
      };
    }

    case "WHAT_AI_DID_THIS_SESSION": {
      const latestBlocked = recentEvents.find(
        (event) => event.type === "action_blocked",
      );

      const latestExecuted = recentEvents.find(
        (event) => event.type === "action_executed",
      );

      const bullets: string[] = [];

      if (latestAlertContent) {
        const inputType = String(latestAlertContent.inputType || "input");
        const riskLevel = String(latestAlertContent.riskLevel || "unknown");
        const redFlags = Array.isArray(latestAlertContent.redFlags)
          ? (latestAlertContent.redFlags as string[])
          : [];
        const recommendedAction = String(
          latestAlertContent.recommendedAction || "No recommendation recorded.",
        );

        bullets.push(`AI analyzed the submitted ${inputType}.`);

        if (redFlags.length > 0) {
          bullets.push(`AI detected ${redFlags.length} red flag(s).`);
        }

        bullets.push(`AI classified the situation as ${riskLevel} risk.`);
        bullets.push(`AI recommended: ${recommendedAction}`);

        if (pendingApprovals.length > 0) {
          bullets.push(
            "AI placed the sensitive next step behind an approval boundary.",
          );
        } else if (latestBlocked) {
          bullets.push(
            "A sensitive action was blocked instead of being allowed to continue automatically.",
          );
        } else if (latestExecuted) {
          bullets.push(
            "The next action was allowed only after the control flow permitted execution.",
          );
        }

        return {
          title: "What AI did in this session",
          answer:
            "AI analyzed the submitted input, assessed risk, and translated that analysis into a controlled next-step recommendation.",
          bullets,
          confidence: "high",
        };
      }

      const aiEvents = recentEvents.filter((event) => {
        const isAiEvent =
          event.category === "ai" || String(event.type).startsWith("ai_");

        if (!isAiEvent) return false;
        if (event.source === "ai.reply") return false;

        return true;
      });

      return {
        title: "What AI did in this session",
        answer:
          aiEvents.length > 0
            ? "AI performed product-level analysis in this session, but there is not enough structured alert output to summarize it more clearly."
            : "I could not find product-level AI activity in this session beyond this explanation request.",
        bullets:
          aiEvents.length > 0
            ? [
                "AI activity exists in the session log, but no structured alert summary was found.",
              ]
            : [],
        confidence: aiEvents.length > 0 ? "medium" : "low",
      };
    }

    case "WHAT_NEEDS_CONFIRMATION": {
      if (pendingApprovals.length === 0) {
        return {
          title: "What needs confirmation",
          answer:
            "There is no pending confirmation required in this session right now.",
          bullets: [],
          confidence: "high",
        };
      }

      const bullets = pendingApprovals.slice(0, 4).map((approval) => {
        return `${formatApprovalActionType(
          approval.actionType,
        )} is waiting for your confirmation.`;
      });

      return {
        title: "What needs confirmation",
        answer:
          pendingApprovals.length === 1
            ? "One sensitive next step is currently waiting for your confirmation before the system can continue."
            : "Several sensitive next steps are currently waiting for your confirmation before the system can continue.",
        bullets,
        confidence: "high",
      };
    }

    case "WHY_LAST_ACTION_BLOCKED": {
      const lastBlocked = recentEvents.find(
        (event) =>
          event.type === "action_blocked" || event.type === "user_rejected",
      );

      if (!lastBlocked) {
        return {
          title: "Why the last action was blocked",
          answer: "I could not find a blocked action in this session.",
          bullets: [],
          confidence: "medium",
        };
      }

      const payload =
        lastBlocked.payload && typeof lastBlocked.payload === "object"
          ? (lastBlocked.payload as Record<string, unknown>)
          : {};

      return {
        title: "Why the last action was blocked",
        answer:
          "The last blocked action appears to have been stopped by the approval boundary or a user rejection.",
        bullets: [
          `event: ${lastBlocked.type}`,
          `source: ${lastBlocked.source}`,
          payload.actionType
            ? `actionType: ${String(payload.actionType)}`
            : "actionType: unknown",
          payload.decisionReason
            ? `reason: ${String(payload.decisionReason)}`
            : "reason: approval boundary did not allow execution",
        ],
        confidence: "high",
      };
    }

    default:
      return buildReplyOutput(input);
  }
}

export async function aiReplyService(input: AiReplyInput) {
  const job = await createAiJob({
    userId: input.userId,
    sessionId: input.sessionId,
    type: AiJobType.REPLY,
    input,
  });

  await createAiEventLog({
    userId: input.userId,
    sessionId: input.sessionId,
    type: "ai_job_created",
    source: "ai.reply",
    correlationId: job.id,
    payload: {
      jobId: job.id,
      jobType: "reply",
      questionKey: input.questionKey || null,
    },
  });

  try {
    await markAiJobRunning(job.id);

    await createAiEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "ai_analysis_started",
      source: "ai.reply",
      correlationId: job.id,
      payload: {
        jobId: job.id,
        jobType: "reply",
        questionKey: input.questionKey || null,
      },
    });

    const outputContent = input.questionKey
      ? await buildControlAssistantReply(input)
      : buildReplyOutput(input);

    const output = await createAiOutput({
      jobId: job.id,
      userId: input.userId,
      outputType: AiOutputType.REPLY,
      content: outputContent,
    });

    await markAiJobCompleted(job.id);

    await createAiEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "ai_analysis_completed",
      source: "ai.reply",
      correlationId: job.id,
      payload: {
        jobId: job.id,
        outputId: output.id,
        questionKey: input.questionKey || null,
      },
    });

    await createAiEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "ai_reply_generated",
      source: "ai.reply",
      correlationId: job.id,
      payload: {
        jobId: job.id,
        outputId: output.id,
        questionKey: input.questionKey || null,
      },
    });

    return { jobId: job.id, output };
  } catch (error) {
    await markAiJobFailed(
      job.id,
      error instanceof Error ? error.message : "Unknown AI reply error",
    );
    throw error;
  }
}

function getScamRawInput(input: AiScamAlertInput) {
  return String(input.input?.rawInput || "");
}

function getScamInputType(input: AiScamAlertInput) {
  return String(input.input?.inputType || "text");
}

function sanitizeScamAlertInputForStorage(
  input: AiScamAlertInput,
  routeDecision: ScamAlertRouteDecision,
): AiScamAlertInput {
  if (!routeDecision.shouldRedact) {
    return input;
  }

  return {
    ...input,
    input: {
      ...input.input,
      rawInput: "[REDACTED_SENSITIVE_INPUT]",
    },
  };
}

function buildBasicRuleOutput(
  input: AiScamAlertInput,
  routeDecision: ScamAlertRouteDecision,
) {
  const inputType = getScamInputType(input);
  const isSensitive = routeDecision.sensitiveInputDetected;
  const redFlags = routeDecision.matchedRules.map((rule) => rule.label);

  if (isSensitive) {
    return withScamAlertAliases({
      summary: "High-risk wallet security issue detected.",
      red_flags:
        redFlags.length > 0
          ? redFlags
          : ["Seed phrase/recovery phrase/private key related input detected"],
      risk_level: "high",
      confidence: "high",
      input_type: inputType,
      analysis_provider: "basic_rule",
      attempted_provider: null,
      fallback_used: false,
      failure_reason: null,
      recommended_action:
        "Never share your seed phrase, recovery phrase, private key, password, or OTP. Bravium blocked this before sending it to AI analysis.",
      needs_user_attention: true,
    });
  }

  if (
    routeDecision.matchedRules.some((rule) => rule.id === "crypto_education")
  ) {
    return withScamAlertAliases({
      summary: "General crypto education question detected.",
      red_flags: [],
      risk_level: "low",
      confidence: "high",
      input_type: inputType,
      analysis_provider: "basic_rule",
      attempted_provider: null,
      fallback_used: false,
      failure_reason: null,
      recommended_action:
        "This looks like a general educational question. No scam action is detected in v1.",
      needs_user_attention: false,
    });
  }

  return withScamAlertAliases({
    summary:
      routeDecision.riskLevel === "high"
        ? "High-risk scam pattern detected by Bravium Basic Rule Engine."
        : routeDecision.riskLevel === "medium"
          ? "Potential scam pattern detected by Bravium Basic Rule Engine."
          : "No major scam pattern detected by Bravium Basic Rule Engine.",
    red_flags: redFlags,
    risk_level: routeDecision.riskLevel,
    confidence: redFlags.length > 0 ? "high" : "low",
    input_type: inputType,
    analysis_provider: "basic_rule",
    attempted_provider: null,
    fallback_used: false,
    failure_reason: null,
    recommended_action:
      routeDecision.riskLevel === "high"
        ? "Pause before taking action. Bravium recommends user review before any wallet connection, payment, or sensitive step."
        : routeDecision.riskLevel === "medium"
          ? "Review carefully before continuing. Do not approve sensitive actions without checking the details."
          : "Proceed with normal caution and continue monitoring.",
    needs_user_attention: routeDecision.riskLevel !== "low",
  });
}

function buildNotVerifiedOutput(
  input: AiScamAlertInput,
  routeDecision: ScamAlertRouteDecision,
) {
  const inputType = getScamInputType(input);

  return withScamAlertAliases({
    summary: "Data verification required. Not verified in this version.",
    red_flags: routeDecision.matchedRules.map((rule) => rule.label),
    risk_level: "medium",
    confidence: "high",
    input_type: inputType,
    analysis_provider: "not_verified",
    attempted_provider: null,
    fallback_used: false,
    failure_reason: null,
    recommended_action:
      "This requires a real contract/domain/security checker. Bravium v1 will not let AI guess. Network/chain or checker integration is required before making a conclusion.",
    needs_user_attention: true,
  });
}

async function buildScamAlertOutput(input: AiScamAlertInput) {
  const routeDecision = classifyScamAlertRoute(input);

  if (routeDecision.route === "BASIC_RULE_ONLY") {
    return {
      routeDecision,
      analysisResult: {
        content: buildBasicRuleOutput(input, routeDecision),
        providerRequested: null,
        providerUsed: "basic_rule",
        fallbackUsed: false,
        failureReason: null,
      },
    };
  }

  if (routeDecision.route === "DATA_CHECK_REQUIRED") {
    return {
      routeDecision,
      analysisResult: {
        content: buildNotVerifiedOutput(input, routeDecision),
        providerRequested: null,
        providerUsed: "not_verified",
        fallbackUsed: false,
        failureReason: null,
      },
    };
  }

  if (routeDecision.shouldCallAi) {
    const analysisResult = await analyzeScamAlertWithApi(input);

    return {
      routeDecision,
      analysisResult,
    };
  }

  return {
    routeDecision,
    analysisResult: {
      content: buildBasicRuleOutput(input, routeDecision),
      providerRequested: null,
      providerUsed: "basic_rule",
      fallbackUsed: false,
      failureReason: null,
    },
  };
}

export async function aiScamAlertService(input: AiScamAlertInput) {
  const routeDecision = classifyScamAlertRoute(input);
  const sanitizedInput = sanitizeScamAlertInputForStorage(input, routeDecision);

  const job = await createAiJob({
    userId: input.userId,
    sessionId: input.sessionId,
    type: "SCAM_ALERT",
    input: sanitizedInput,
  });

  await createAiEventLog({
    userId: input.userId,
    sessionId: input.sessionId,
    type: "ai_job_created",
    source: "ai.scam-alert",
    correlationId: job.id,
    payload: {
      jobId: job.id,
      jobType: "SCAM_ALERT",
      inputType: getScamInputType(input),
      rawInputSaved: !routeDecision.shouldRedact,
      sensitiveInputDetected: routeDecision.sensitiveInputDetected,
      sensitiveType: routeDecision.sensitiveType,
    },
  });

  await createAiEventLog({
    userId: input.userId,
    sessionId: input.sessionId,
    type: "ai_scam_route_classified",
    source: "ai.scam-alert.router",
    correlationId: job.id,
    payload: {
      jobId: job.id,
      route: routeDecision.route,
      shouldCallAi: routeDecision.shouldCallAi,
      shouldRedact: routeDecision.shouldRedact,
      riskLevel: routeDecision.riskLevel,
      reason: routeDecision.reason,
      matchedRules: routeDecision.matchedRules,
      sensitiveInputDetected: routeDecision.sensitiveInputDetected,
      sensitiveType: routeDecision.sensitiveType,
      rawInputSaved: !routeDecision.shouldRedact,
    },
  });

  if (routeDecision.sensitiveInputDetected) {
    await createAiEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "ai_scam_sensitive_input_blocked",
      source: "ai.scam-alert.router",
      correlationId: job.id,
      payload: {
        jobId: job.id,
        sensitive_input_detected: true,
        sensitive_type: routeDecision.sensitiveType,
        raw_input_saved: false,
        external_ai_called: false,
      },
    });
  }

  const shouldEmitAiStarted = routeDecision.shouldCallAi;

  if (shouldEmitAiStarted) {
    await createAiEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "ai_analysis_started",
      source: "ai.scam-alert",
      correlationId: job.id,
      payload: {
        jobId: job.id,
        inputType: getScamInputType(input),
        route: routeDecision.route,
      },
    });
  }

  const { analysisResult } = await buildScamAlertOutput(input);
  const outputContent = analysisResult.content;

  if (!routeDecision.shouldCallAi) {
    await createAiEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "ai_scam_basic_rule_used",
      source: "ai.scam-alert.rule-engine",
      correlationId: job.id,
      payload: {
        jobId: job.id,
        route: routeDecision.route,
        analysisProvider: outputContent.analysis_provider,
        attemptedProvider: outputContent.attempted_provider,
        fallbackUsed: outputContent.fallback_used,
        riskLevel: outputContent.risk_level,
        matchedRules: routeDecision.matchedRules,
      },
    });
  }

  if (routeDecision.shouldCallAi && analysisResult.failureReason) {
    await createAiEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "ai_analysis_failed",
      source: "ai.scam-alert",
      correlationId: job.id,
      payload: {
        jobId: job.id,
        providerRequested: analysisResult.providerRequested,
        failureReason: analysisResult.failureReason,
      },
    });
  }

  if (routeDecision.shouldCallAi && analysisResult.fallbackUsed) {
    await createAiEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "ai_fallback_used",
      source: "ai.scam-alert",
      correlationId: job.id,
      payload: {
        jobId: job.id,
        providerRequested: analysisResult.providerRequested,
        providerUsed: analysisResult.providerUsed,
        fallbackProvider: "rule_fallback",
      },
    });
  }

  const output = await createAiOutput({
    jobId: job.id,
    userId: input.userId,
    outputType: "ALERT",
    content: outputContent as any,
  });

  if (routeDecision.shouldCallAi && !analysisResult.fallbackUsed) {
    await createAiEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "ai_analysis_completed",
      source: "ai.scam-alert",
      correlationId: job.id,
      payload: {
        jobId: job.id,
        providerRequested: analysisResult.providerRequested,
        providerUsed: analysisResult.providerUsed,
        fallbackUsed: analysisResult.fallbackUsed,
        route: routeDecision.route,
      },
    });
  }

  await createAiEventLog({
    userId: input.userId,
    sessionId: input.sessionId,
    type: "ai_alert_generated",
    source: "ai.scam-alert",
    correlationId: job.id,
    payload: {
      jobId: job.id,
      outputId: output.id,
      inputType: outputContent.input_type,
      route: routeDecision.route,
      riskLevel: outputContent.risk_level,
      confidence: outputContent.confidence,
      redFlagCount: outputContent.red_flags.length,
      needsUserAttention: outputContent.needs_user_attention,
      requiresApproval: outputContent.requiresApproval,
      analysisProvider: outputContent.analysis_provider,
      attemptedProvider: outputContent.attempted_provider,
      fallbackUsed: outputContent.fallback_used,
      failureReason: outputContent.failure_reason,
      rawInputSaved: !routeDecision.shouldRedact,
    },
  });

  return {
    jobId: job.id,
    output,
  };
}
