import { GoogleGenAI, Type } from "@google/genai";
import OpenAI from "openai";
import type { AiScamAlertInput } from "../modules/ai/ai.schema";
import type {
  AiProvider,
  AnalysisProvider,
  ScamAlertAnalysisContent,
  ScamAlertAnalysisResult,
  ScamAlertConfidence,
  ScamAlertRiskLevel,
} from "../modules/ai/scamAlertTypes";

const GEMINI_SCAM_ALERT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
    },
    red_flags: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
    },
    risk_level: {
      type: Type.STRING,
      enum: ["low", "medium", "high"],
    },
    confidence: {
      type: Type.STRING,
      enum: ["low", "medium", "high"],
    },
    recommended_action: {
      type: Type.STRING,
    },
    needs_user_attention: {
      type: Type.BOOLEAN,
    },
  },
  required: [
    "summary",
    "red_flags",
    "risk_level",
    "confidence",
    "recommended_action",
    "needs_user_attention",
  ],
};

const OPENAI_SCAM_ALERT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: {
      type: "string",
    },
    red_flags: {
      type: "array",
      items: {
        type: "string",
      },
    },
    risk_level: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    recommended_action: {
      type: "string",
    },
    needs_user_attention: {
      type: "boolean",
    },
  },
  required: [
    "summary",
    "red_flags",
    "risk_level",
    "confidence",
    "recommended_action",
    "needs_user_attention",
  ],
};

function getProvider(): AiProvider {
  const provider = String(process.env.AI_PROVIDER || "mock").toLowerCase();

  if (provider === "gemini") return "gemini";
  if (provider === "openai") return "openai";

  return "mock";
}

function getInputType(input: AiScamAlertInput) {
  return String(input.input?.inputType || "text");
}

function getRawInput(input: AiScamAlertInput) {
  return String(input.input?.rawInput || "");
}

function stringifyError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "unknown_error";
}

function shouldPrintProviderError() {
  return process.env.NODE_ENV !== "production";
}

function normalizeRiskLevel(value: unknown): ScamAlertRiskLevel {
  const raw = String(value || "").toLowerCase();

  if (raw === "low" || raw === "medium" || raw === "high") {
    return raw;
  }

  return "medium";
}

function normalizeConfidence(value: unknown): ScamAlertConfidence {
  const raw = String(value || "").toLowerCase();

  if (raw === "low" || raw === "medium" || raw === "high") {
    return raw;
  }

  return "medium";
}

export function withScamAlertAliases(
  content: Omit<
    ScamAlertAnalysisContent,
    | "redFlags"
    | "riskLevel"
    | "inputType"
    | "analysisProvider"
    | "requiresApproval"
    | "recommendedAction"
  >,
): ScamAlertAnalysisContent {
  return {
    ...content,
    redFlags: content.red_flags,
    riskLevel: content.risk_level,
    inputType: content.input_type,
    analysisProvider: content.analysis_provider,
    requiresApproval: content.needs_user_attention,
    recommendedAction: content.recommended_action,
  };
}

function normalizeModelAnalysis(
  parsed: Partial<ScamAlertAnalysisContent>,
  input: AiScamAlertInput,
  provider: AnalysisProvider,
  attemptedProvider: AiProvider,
): ScamAlertAnalysisContent {
  const inputType = getInputType(input);
  const riskLevel = normalizeRiskLevel(parsed.risk_level);
  const confidence = normalizeConfidence(parsed.confidence);
  const redFlags = Array.isArray(parsed.red_flags) ? parsed.red_flags : [];

  return withScamAlertAliases({
    summary: String(parsed.summary || "No summary returned."),
    red_flags: redFlags,
    risk_level: riskLevel,
    confidence,
    input_type: inputType,
    analysis_provider: provider,
    attempted_provider: attemptedProvider,
    fallback_used: false,
    failure_reason: null,
    recommended_action: String(
      parsed.recommended_action ||
        "Review carefully before taking any sensitive action.",
    ),
    needs_user_attention:
      typeof parsed.needs_user_attention === "boolean"
        ? parsed.needs_user_attention
        : riskLevel !== "low",
  });
}

function buildRuleFallbackAnalysis(
  input: AiScamAlertInput,
  attemptedProvider: AiProvider,
  failureReason: string,
): ScamAlertAnalysisContent {
  const inputType = getInputType(input);
  const rawInput = getRawInput(input);
  const raw = rawInput.toLowerCase();

  const redFlags: string[] = [];

  if (raw.includes("guaranteed profit") || raw.includes("guaranteed return")) {
    redFlags.push("Guaranteed profit or return claim");
  }

  if (/\b\d+(\.\d+)?%\s*(daily|per day|a day)\b/i.test(raw)) {
    redFlags.push("Unrealistic daily return");
  }

  if (
    raw.includes("connect wallet") ||
    raw.includes("verify wallet") ||
    raw.includes("wallet connect")
  ) {
    redFlags.push("Wallet connection requested");
  }

  if (raw.includes("anonymous team")) {
    redFlags.push("Anonymous team");
  }

  if (raw.includes("unclear tokenomics")) {
    redFlags.push("Unclear tokenomics");
  }

  if (raw.includes("urgent") || raw.includes("immediately")) {
    redFlags.push("Urgency pressure detected");
  }

  const riskLevel: ScamAlertRiskLevel =
    redFlags.length >= 2 ? "high" : redFlags.length === 1 ? "medium" : "low";

  return withScamAlertAliases({
    summary:
      riskLevel === "high"
        ? `High-risk scam indicators detected in submitted ${inputType}.`
        : riskLevel === "medium"
          ? `Potential scam indicators detected in submitted ${inputType}.`
          : `No major scam indicators detected in submitted ${inputType}.`,
    red_flags: redFlags,
    risk_level: riskLevel,
    confidence: redFlags.length > 0 ? "medium" : "low",
    input_type: inputType,
    analysis_provider: "rule_fallback",
    attempted_provider: attemptedProvider,
    fallback_used: true,
    failure_reason: failureReason,
    recommended_action:
      riskLevel === "high"
        ? "Block sensitive next actions and require user approval before continuing."
        : riskLevel === "medium"
          ? "Warn the user and review details carefully before taking action."
          : "Proceed with normal caution and continue monitoring.",
    needs_user_attention: riskLevel !== "low",
  });
}

function buildScamAlertPrompt(input: AiScamAlertInput) {
  return JSON.stringify({
    role: "Bravium Scam Alert AI",
    thesis:
      "AI analyzes scam risk, but the user remains in control. Do not execute actions.",
    task: "Analyze the submitted crypto/Web3 input for scam risk. Return concise structured JSON only.",
    input_type: getInputType(input),
    raw_input: getRawInput(input),
    output_rules: {
      summary: "short investor-demo friendly summary",
      red_flags: "specific warning signs found",
      risk_level: "low | medium | high",
      confidence: "low | medium | high",
      recommended_action:
        "clear next action while preserving user control and approval boundary",
      needs_user_attention:
        "true if any sensitive next action should be reviewed by the user",
    },
    constraints: [
      "Do not claim live on-chain verification.",
      "Do not say you crawled the link unless the content was provided.",
      "Do not tell the user to proceed with risky actions.",
      "Do not execute transactions.",
      "Never ask the user for seed phrase, recovery phrase, private key, password, or OTP.",
    ],
  });
}

async function analyzeWithGemini(
  input: AiScamAlertInput,
): Promise<ScamAlertAnalysisContent> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: buildScamAlertPrompt(input),
    config: {
      responseMimeType: "application/json",
      responseSchema: GEMINI_SCAM_ALERT_SCHEMA,
    },
  });

  const outputText = response.text;

  if (!outputText) {
    throw new Error("Gemini returned empty response");
  }

  const parsed = JSON.parse(outputText) as Partial<ScamAlertAnalysisContent>;

  return normalizeModelAnalysis(parsed, input, "gemini", "gemini");
}

async function analyzeWithOpenAi(
  input: AiScamAlertInput,
): Promise<ScamAlertAnalysisContent> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model,
    instructions:
      "You are Bravium Scam Alert AI. Analyze crypto/Web3 scam risk. Return only structured JSON. Do not execute transactions. Keep user control and approval boundaries intact.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildScamAlertPrompt(input),
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "scam_alert_analysis",
        schema: OPENAI_SCAM_ALERT_SCHEMA,
        strict: true,
      },
    },
  });

  if (!response.output_text) {
    throw new Error("OpenAI returned empty response");
  }

  const parsed = JSON.parse(
    response.output_text,
  ) as Partial<ScamAlertAnalysisContent>;

  return normalizeModelAnalysis(parsed, input, "openai", "openai");
}

export async function analyzeScamAlertWithApi(
  input: AiScamAlertInput,
): Promise<ScamAlertAnalysisResult> {
  const provider = getProvider();

  if (provider === "mock") {
    const content = withScamAlertAliases({
      summary: "Mock scam analysis completed.",
      red_flags: [],
      risk_level: "low",
      confidence: "low",
      input_type: getInputType(input),
      analysis_provider: "mock",
      attempted_provider: null,
      fallback_used: false,
      failure_reason: null,
      recommended_action:
        "Proceed with normal caution and continue monitoring.",
      needs_user_attention: false,
    });

    return {
      content,
      providerRequested: "mock",
      providerUsed: "mock",
      fallbackUsed: false,
      failureReason: null,
    };
  }

  try {
    const content =
      provider === "gemini"
        ? await analyzeWithGemini(input)
        : await analyzeWithOpenAi(input);

    return {
      content,
      providerRequested: provider,
      providerUsed: content.analysis_provider,
      fallbackUsed: false,
      failureReason: null,
    };
  } catch (error) {
    const failureReason = stringifyError(error);

    if (shouldPrintProviderError()) {
      console.error("[Bravium AI Provider Error]", {
        provider,
        failureReason,
      });
    }

    const content = buildRuleFallbackAnalysis(input, provider, failureReason);

    return {
      content,
      providerRequested: provider,
      providerUsed: "rule_fallback",
      fallbackUsed: true,
      failureReason,
    };
  }
}
