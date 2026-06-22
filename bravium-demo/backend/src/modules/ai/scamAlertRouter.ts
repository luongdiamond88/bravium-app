import type { AiScamAlertInput } from "./ai.schema";
import {
  detectBasicScamPatterns,
  detectSensitiveWalletSecret,
  getWordCount,
  isContractAddressOnly,
  isCryptoEducationQuestion,
  isLikelyDataCheckQuestion,
} from "./scamAlertRules";
import type {
  ScamAlertRouteDecision,
  ScamAlertRuleMatch,
} from "./scamAlertTypes";

function getRawInput(input: AiScamAlertInput) {
  return String(input.input?.rawInput || "");
}

function hasProjectContext(rawInput: string) {
  const raw = rawInput.toLowerCase();

  return (
    raw.includes("project") ||
    raw.includes("tokenomics") ||
    raw.includes("whitepaper") ||
    raw.includes("telegram") ||
    raw.includes("discord") ||
    raw.includes("twitter") ||
    raw.includes("x post") ||
    raw.includes("team") ||
    raw.includes("roadmap") ||
    raw.includes("liquidity")
  );
}

function asksForAnalysis(rawInput: string) {
  const raw = rawInput.toLowerCase();

  return (
    raw.includes("analyze") ||
    raw.includes("analyse") ||
    raw.includes("risk") ||
    raw.includes("red flag") ||
    raw.includes("scam") ||
    raw.includes("phân tích") ||
    raw.includes("phan tich") ||
    raw.includes("đánh giá") ||
    raw.includes("danh gia")
  );
}

function buildDecision(value: ScamAlertRouteDecision): ScamAlertRouteDecision {
  return value;
}

export function classifyScamAlertRoute(
  input: AiScamAlertInput,
): ScamAlertRouteDecision {
  const rawInput = getRawInput(input);
  const wordCount = getWordCount(rawInput);

  const sensitive = detectSensitiveWalletSecret(rawInput);

  if (sensitive.detected) {
    return buildDecision({
      route: "BASIC_RULE_ONLY",
      matchedRules: sensitive.matchedRules,
      shouldCallAi: false,
      shouldRedact: true,
      riskLevel: "high",
      reason: "Sensitive wallet credential detected before AI analysis.",
      sensitiveInputDetected: true,
      sensitiveType: sensitive.sensitiveType,
    });
  }

  if (isContractAddressOnly(rawInput) || isLikelyDataCheckQuestion(rawInput)) {
    const matchedRules: ScamAlertRuleMatch[] = [
      {
        id: "data_checker_required",
        label: "This input requires a real data checker, not AI guessing",
        severity: "medium",
      },
    ];

    return buildDecision({
      route: "DATA_CHECK_REQUIRED",
      matchedRules,
      shouldCallAi: false,
      shouldRedact: false,
      riskLevel: "medium",
      reason: "Contract/security verification requires external checker data.",
      sensitiveInputDetected: false,
      sensitiveType: null,
    });
  }

  if (isCryptoEducationQuestion(rawInput)) {
    return buildDecision({
      route: "BASIC_RULE_ONLY",
      matchedRules: [
        {
          id: "crypto_education",
          label: "General crypto education question",
          severity: "low",
        },
      ],
      shouldCallAi: false,
      shouldRedact: false,
      riskLevel: "low",
      reason:
        "Simple educational question can be answered without AI provider.",
      sensitiveInputDetected: false,
      sensitiveType: null,
    });
  }

  const basicPatterns = detectBasicScamPatterns(rawInput);

  if (basicPatterns.matchedRules.length > 0) {
    const shouldUseAi =
      wordCount >= 12 ||
      hasProjectContext(rawInput) ||
      asksForAnalysis(rawInput) ||
      basicPatterns.matchedRules.length >= 3;

    return buildDecision({
      route: "RULE_WARNING_OPTIONAL_AI",
      matchedRules: basicPatterns.matchedRules,
      shouldCallAi: shouldUseAi,
      shouldRedact: false,
      riskLevel: basicPatterns.highestRiskLevel,
      reason: shouldUseAi
        ? "Scam warning rules matched, but input has enough context for AI analysis."
        : "Scam warning rules matched and are clear enough for basic rule response.",
      sensitiveInputDetected: false,
      sensitiveType: null,
    });
  }

  if (
    wordCount >= 10 ||
    hasProjectContext(rawInput) ||
    asksForAnalysis(rawInput)
  ) {
    return buildDecision({
      route: "AI_ANALYSIS",
      matchedRules: [],
      shouldCallAi: true,
      shouldRedact: false,
      riskLevel: "medium",
      reason: "Input requires contextual scam analysis.",
      sensitiveInputDetected: false,
      sensitiveType: null,
    });
  }

  return buildDecision({
    route: "BASIC_RULE_ONLY",
    matchedRules: [
      {
        id: "no_major_rule_match",
        label: "No major scam pattern detected by basic rules",
        severity: "low",
      },
    ],
    shouldCallAi: false,
    shouldRedact: false,
    riskLevel: "low",
    reason:
      "No high-risk pattern detected; basic rule response is enough for v1.",
    sensitiveInputDetected: false,
    sensitiveType: null,
  });
}
