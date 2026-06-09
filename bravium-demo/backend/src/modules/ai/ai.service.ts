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

function buildScamAlertOutput(input: AiScamAlertInput) {
  const inputType = String(input.input?.inputType || "unknown");
  const rawInput = String(input.input?.rawInput || "");
  const raw = rawInput.toLowerCase();

  const detectedFlags: string[] = [];

  if (raw.includes("seed phrase") || raw.includes("recovery phrase")) {
    detectedFlags.push("Requests seed phrase or recovery phrase");
  }

  if (raw.includes("private key")) {
    detectedFlags.push("Requests private key");
  }

  if (
    raw.includes("urgent") ||
    raw.includes("immediately") ||
    raw.includes("now")
  ) {
    detectedFlags.push("Uses urgency language");
  }

  if (
    raw.includes("claim reward") ||
    raw.includes("airdrop") ||
    raw.includes("guaranteed profit")
  ) {
    detectedFlags.push("Promises reward or guaranteed profit");
  }

  if (raw.includes("verify wallet") || raw.includes("wallet connect")) {
    detectedFlags.push("Requests wallet verification or wallet connection");
  }

  if (raw.includes("send first")) {
    detectedFlags.push("Asks user to send funds first");
  }

  const riskLevel =
    detectedFlags.length >= 3
      ? "high"
      : detectedFlags.length >= 1
        ? "medium"
        : "low";

  const requiresApproval = riskLevel === "high";

  const summary =
    riskLevel === "high"
      ? `High-risk scam indicators detected in submitted ${inputType}.`
      : riskLevel === "medium"
        ? `Potential scam indicators detected in submitted ${inputType}.`
        : `No major scam indicators detected in submitted ${inputType}.`;

  const recommendedAction =
    riskLevel === "high"
      ? "Block sensitive next actions and require user approval before continuing."
      : riskLevel === "medium"
        ? "Warn the user and review details carefully before taking action."
        : "Proceed with normal caution and continue monitoring.";

  return {
    summary,
    redFlags: detectedFlags,
    riskLevel,
    recommendedAction,
    requiresApproval,
    inputType,
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

export async function aiScamAlertService(input: AiScamAlertInput) {
  const job = await createAiJob({
    userId: input.userId,
    sessionId: input.sessionId,
    type: AiJobType.SCAM_ALERT,
    input,
  });

  await createAiEventLog({
    userId: input.userId,
    sessionId: input.sessionId,
    type: "ai_job_created",
    source: "ai.scam-alert",
    correlationId: job.id,
    payload: {
      jobId: job.id,
      jobType: "scam_alert",
    },
  });

  try {
    await markAiJobRunning(job.id);

    await createAiEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "ai_analysis_started",
      source: "ai.scam-alert",
      correlationId: job.id,
      payload: {
        jobId: job.id,
        jobType: "scam_alert",
      },
    });

    const outputContent = buildScamAlertOutput(input);

    const output = await createAiOutput({
      jobId: job.id,
      userId: input.userId,
      outputType: AiOutputType.ALERT,
      content: outputContent,
    });

    await markAiJobCompleted(job.id);

    await createAiEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "ai_analysis_completed",
      source: "ai.scam-alert",
      correlationId: job.id,
      payload: {
        jobId: job.id,
        outputId: output.id,
      },
    });

    await createAiEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "ai_alert_generated",
      source: "ai.scam-alert",
      correlationId: job.id,
      payload: {
        jobId: job.id,
        outputId: output.id,
        inputType: outputContent.inputType,
        riskLevel: outputContent.riskLevel,
        redFlagCount: outputContent.redFlags.length,
        requiresApproval: outputContent.requiresApproval,
      },
    });

    return { jobId: job.id, output };
  } catch (error) {
    await markAiJobFailed(
      job.id,
      error instanceof Error ? error.message : "Unknown scam alert error",
    );
    throw error;
  }
}
