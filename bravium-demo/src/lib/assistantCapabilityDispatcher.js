// P03.3 — one dispatcher for both text and voice after explicit Send.
// Services are the app's existing API helpers, injected by AIAssistant.jsx.
// No on-chain action, expense save, approval request, or device action happens here.

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function folded(value) {
  return asText(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

export function getControlQuestionKey(input) {
  const text = folded(input);

  if (/why.*(warn|alert)|tai sao.*(canh bao|bi canh bao)/.test(text)) {
    return "WHY_WARNED";
  }

  if (/what.*ai.*(do|did).*session|ai.*(lam gi|da lam gi).*phien/.test(text)) {
    return "WHAT_AI_DID_THIS_SESSION";
  }

  if (
    /what.*(need|needs).*confirm|what.*approv|can (xac nhan|phe duyet)|buoc nao.*xac nhan/.test(
      text,
    )
  ) {
    return "WHAT_NEEDS_CONFIRMATION";
  }

  if (
    /why.*(last )?action.*block|why.*block|tai sao.*(chan|bi chan|block)/.test(
      text,
    )
  ) {
    return "WHY_LAST_ACTION_BLOCKED";
  }

  return null;
}

function withAnswer(
  route,
  {
    summary,
    answer,
    actions = [],
    attention = false,
    approval = false,
    status = "completed",
    actionUrl = null,
  } = {},
) {
  return {
    ...route,
    summary: summary || route.summary,
    answer_text: answer || route.answer_text,
    suggested_actions: actions.length ? actions : route.suggested_actions,
    needs_user_attention: attention,
    needs_user_approval: approval,
    capability_status: status,
    action_url: actionUrl,
  };
}

function missingContext(route) {
  return withAnswer(route, {
    summary: "Session context required",
    answer:
      "I recognized the feature, but cannot call its API until a real userId and sessionId are available. No action was taken.",
    attention: true,
    status: "needs_context",
  });
}

function capitalGuardUrl({ userId, sessionId }) {
  const params = new URLSearchParams();

  if (userId) params.set("userId", userId);
  if (sessionId) params.set("sessionId", sessionId);

  const query = params.toString();

  return `/capital-guard${query ? `?${query}` : ""}`;
}

function usableFinanceInputs(financeContext = {}, userState = {}) {
  const source = { ...userState, ...financeContext };

  const balance = source.availableBalance;
  const buffer = source.safetyBuffer;
  const days = source.windowDays;
  const currency = asText(source.accountCurrency);

  if (
    balance === "" ||
    balance == null ||
    buffer === "" ||
    buffer == null ||
    days === "" ||
    days == null ||
    !currency ||
    !Number.isFinite(Number(balance)) ||
    Number(balance) < 0 ||
    !Number.isFinite(Number(buffer)) ||
    Number(buffer) < 0 ||
    ![7, 14, 30].includes(Number(days))
  ) {
    return null;
  }

  return {
    availableBalance: Number(balance),
    accountCurrency: currency,
    safetyBuffer: Number(buffer),
    windowDays: Number(days),
  };
}

function getRiskReport(data) {
  const report =
    data?.result ||
    data?.analysis ||
    data?.output?.content?.report ||
    data?.output?.content ||
    data?.report ||
    data ||
    {};

  const flags = Array.isArray(report.redFlags)
    ? report.redFlags
    : Array.isArray(report.red_flags)
      ? report.red_flags
      : [];

  return {
    summary: asText(report.summary),

    risk: asText(report.riskLevel || report.risk_level),

    redFlags: flags
      .map((flag) =>
        typeof flag === "string"
          ? flag
          : asText(flag?.description || flag?.message || flag?.title),
      )
      .filter(Boolean),

    recommendation: asText(
      report.recommendedAction || report.recommended_action,
    ),

    attention: Boolean(
      report.needsUserAttention ?? report.needs_user_attention,
    ),
  };
}

export async function dispatchAssistantCapability({
  route,
  request,
  userId = "",
  sessionId = "",
  services = {},
} = {}) {
  if (!route || !request) {
    throw new Error("Missing assistant route or request");
  }

  // All unavailable, unknown, and legacy wallet shells remain read-only.
  if (
    route.routing_status !== "ready_for_dispatch" ||
    route.mode === "wallet_guidance_shell"
  ) {
    return {
      dispatched: false,
      response: route,
    };
  }

  const text = asText(request.input_text);

  const effectiveSessionId = asText(sessionId || request.session_id);

  const effectiveUserId = asText(userId || request.optional_user_state?.userId);

  const questionKey = getControlQuestionKey(text);

  // A greeting or unsupported general question uses the existing shell.
  // /ai/reply only accepts the four Control Assistant question keys.
  if (route.intent === "general_chat" && !questionKey) {
    return {
      dispatched: false,
      response: withAnswer(route, {
        status: "shell_only",
      }),
    };
  }

  // =====================================================
  // CAPITAL GUARD
  // =====================================================

  if (route.intent === "capital_guard") {
    if (!effectiveUserId || !effectiveSessionId) {
      // Allow navigation, but do not execute a backend check.
      return {
        dispatched: false,
        response: withAnswer(route, {
          summary: "Capital Guard is ready for your review",

          answer:
            "I recognized your investment request, but session context is missing. " +
            "Open Capital Guard to review your user ID, balance, safety buffer, " +
            "and obligations before manually running a check. " +
            "No safety check or trade was performed.",

          actions: ["Open Capital Guard and review the numbers"],

          attention: true,

          status: "needs_context",

          actionUrl: capitalGuardUrl({
            userId: effectiveUserId,
            sessionId: effectiveSessionId,
          }),
        }),
      };
    }

    const financialInputs = usableFinanceInputs(
      request.finance_context,
      request.optional_user_state,
    );

    if (!financialInputs) {
      return {
        dispatched: false,

        response: withAnswer(route, {
          summary: "Capital Guard needs your balance and safety buffer",

          answer:
            "I recognized your investment request. Open Capital Guard to review the balance, buffer and upcoming obligations before running the safety check. No transaction or check was performed.",

          actions: ["Open Capital Guard and review the numbers"],

          attention: true,

          status: "needs_input",

          actionUrl: capitalGuardUrl({
            userId: effectiveUserId,
            sessionId: effectiveSessionId,
          }),
        }),
      };
    }

    const data = await services.runCapitalGuardCheck({
      userId: effectiveUserId,
      sessionId: effectiveSessionId,
      text,
      ...financialInputs,
    });

    const guard = data?.capitalGuard || {};

    const status = asText(guard.status) || "unknown";
    const message = asText(guard.message);

    return {
      dispatched: true,

      response: withAnswer(route, {
        summary: `Capital Guard: ${status}`,

        answer:
          message ||
          "Capital Guard returned a result. Open Capital Guard to inspect its details.",

        actions: ["Review Capital Guard details"],

        attention: status !== "safe",

        status: "completed",

        actionUrl: capitalGuardUrl({
          userId: effectiveUserId,
          sessionId: effectiveSessionId,
        }),
      }),
    };
  }

  // =====================================================
  // SESSION VALIDATION
  // =====================================================

  if (!effectiveUserId || !effectiveSessionId) {
    return {
      dispatched: false,
      response: missingContext(route),
    };
  }

  // =====================================================
  // CONTROL ASSISTANT
  // =====================================================

  if (
    route.intent === "general_chat" ||
    (route.intent === "scam_alert" && questionKey === "WHY_WARNED")
  ) {
    if (!questionKey) {
      return {
        dispatched: false,

        response: withAnswer(route, {
          status: "shell_only",
        }),
      };
    }

    const data = await services.askControlAssistant({
      userId: effectiveUserId,
      sessionId: effectiveSessionId,
      questionKey,

      context: {
        feature: asText(request.current_feature) || "ask_bravium",
      },
    });

    const content = data?.output?.content || {};

    const bullets = Array.isArray(content.bullets) ? content.bullets : [];

    const answer = [
      asText(content.answer),
      ...bullets.filter((bullet) => typeof bullet === "string"),
    ]
      .filter(Boolean)
      .join("\n• ");

    return {
      dispatched: true,

      response: withAnswer(route, {
        summary: asText(content.title) || "Control Assistant",

        answer:
          answer ||
          "Control Assistant returned no answer text. Please check the existing Control Assistant panel.",

        attention: false,

        status: "completed",
      }),
    };
  }

  // =====================================================
  // SCAM ALERT
  // =====================================================

  if (route.intent === "scam_alert") {
    // Existing backend must run seed/private-key hard rules
    // before calling Gemini.

    const data = await services.submitScamAlert({
      userId: effectiveUserId,
      sessionId: effectiveSessionId,
      inputType: "text",
      rawInput: text,
    });

    const report = getRiskReport(data);

    const details = [
      report.summary,

      report.risk ? `Risk level: ${report.risk}` : "",

      report.redFlags.length ? `Red flags: ${report.redFlags.join("; ")}` : "",

      report.recommendation
        ? `Recommended action: ${report.recommendation}`
        : "",
    ].filter(Boolean);

    const highRisk = /^(high|critical)$/i.test(report.risk);

    return {
      dispatched: true,

      response: withAnswer(route, {
        summary: "Scam Alert analysis received",

        answer:
          details.join("\n") ||
          "Scam Alert returned a result. Open Scam Alert to review the risk report.",

        attention: highRisk || report.attention,

        status: "completed",
      }),
    };
  }

  // =====================================================
  // FIXED EXPENSES
  // =====================================================

  if (route.intent === "fixed_expenses") {
    // Parse only.
    // Saving requires the existing review/confirm UI.

    const data = await services.parseFixedExpenses({
      userId: effectiveUserId,
      sessionId: effectiveSessionId,
      text,
    });

    const drafts =
      data?.candidates ||
      data?.output?.content?.candidates ||
      data?.parsedExpenses ||
      data?.expenses;

    const count = Array.isArray(drafts)
      ? `${drafts.length} draft(s)`
      : "a parse response";

    const preview = Array.isArray(drafts)
      ? drafts
          .slice(0, 5)
          .map((draft) => {
            const label =
              asText(draft?.label || draft?.name || draft?.description) ||
              "Expense";

            const amount =
              Number.isFinite(Number(draft?.amount)) && draft?.amount != null
                ? `${draft.amount} ${asText(draft.currency)}`.trim()
                : "amount needs review";

            const due = draft?.dueDay != null ? `, day ${draft.dueDay}` : "";

            return `${label}: ${amount}${due}`;
          })
          .join("\n")
      : "";

    return {
      dispatched: true,

      response: withAnswer(route, {
        summary: "Fixed Expenses parsed — review required",

        answer:
          `The parser returned ${count}.` +
          `${preview ? `\n${preview}` : ""}` +
          `\nCopy your request into the existing Fixed Expenses review screen before confirming. Nothing has been saved automatically.`,

        actions: ["Review and confirm in Fixed Expenses"],

        attention: true,

        status: "review_required",
      }),
    };
  }

  // =====================================================
  // FALLBACK
  // =====================================================

  return {
    dispatched: false,
    response: route,
  };
}
