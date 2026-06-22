export type AiProvider = "mock" | "gemini" | "openai";

export type AnalysisProvider =
  | "mock"
  | "basic_rule"
  | "gemini"
  | "openai"
  | "rule_fallback"
  | "not_verified";

export type ScamAlertRiskLevel = "low" | "medium" | "high";

export type ScamAlertConfidence = "low" | "medium" | "high";

export type ScamAlertRoute =
  | "BASIC_RULE_ONLY"
  | "RULE_WARNING_OPTIONAL_AI"
  | "AI_ANALYSIS"
  | "DATA_CHECK_REQUIRED";

export type SensitiveInputType =
  | "seed_phrase"
  | "private_key"
  | "recovery_phrase"
  | "mnemonic"
  | "password"
  | "otp"
  | "unknown_sensitive";

export type ScamAlertRuleMatch = {
  id: string;
  label: string;
  severity: ScamAlertRiskLevel;
};

export type ScamAlertRouteDecision = {
  route: ScamAlertRoute;
  matchedRules: ScamAlertRuleMatch[];
  shouldCallAi: boolean;
  shouldRedact: boolean;
  riskLevel: ScamAlertRiskLevel;
  reason: string;
  sensitiveInputDetected: boolean;
  sensitiveType: SensitiveInputType | null;
};

export type ScamAlertAnalysisContent = {
  summary: string;
  red_flags: string[];
  risk_level: ScamAlertRiskLevel;
  confidence: ScamAlertConfidence;
  input_type: string;
  analysis_provider: AnalysisProvider;
  attempted_provider: AiProvider | null;
  fallback_used: boolean;
  failure_reason: string | null;
  recommended_action: string;
  needs_user_attention: boolean;

  // Backward-compatible aliases
  redFlags: string[];
  riskLevel: ScamAlertRiskLevel;
  inputType: string;
  analysisProvider: AnalysisProvider;
  requiresApproval: boolean;
  recommendedAction: string;
};

export type ScamAlertAnalysisResult = {
  content: ScamAlertAnalysisContent;
  providerRequested: AiProvider | null;
  providerUsed: AnalysisProvider;
  fallbackUsed: boolean;
  failureReason: string | null;
};
