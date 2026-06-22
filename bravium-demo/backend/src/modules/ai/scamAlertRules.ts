import type {
  ScamAlertConfidence,
  ScamAlertRiskLevel,
  ScamAlertRuleMatch,
  SensitiveInputType,
} from "./scamAlertTypes";

function normalizeText(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim();
}

function hasMatch(raw: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(raw));
}

function countWords(rawInput: string) {
  return rawInput.trim().split(/\s+/).filter(Boolean).length;
}

function looksLikePotentialMnemonic(rawInput: string) {
  const cleaned = rawInput.trim();

  if (!cleaned) return false;

  const words = cleaned
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length !== 12 && words.length !== 24) {
    return false;
  }

  const everyTokenLooksLikeWord = words.every((word) =>
    /^[a-zA-Z]{2,20}$/.test(word),
  );

  const hasSentencePunctuation = /[.,!?;:]/.test(cleaned);

  return everyTokenLooksLikeWord && !hasSentencePunctuation;
}

export function detectSensitiveWalletSecret(rawInput: string): {
  detected: boolean;
  sensitiveType: SensitiveInputType | null;
  matchedRules: ScamAlertRuleMatch[];
} {
  const raw = normalizeText(rawInput);
  const matchedRules: ScamAlertRuleMatch[] = [];

  const add = (
    id: string,
    label: string,
    severity: ScamAlertRiskLevel = "high",
  ) => {
    if (!matchedRules.some((item) => item.id === id)) {
      matchedRules.push({ id, label, severity });
    }
  };

  if (
    hasMatch(raw, [
      /\bseed phrase\b/i,
      /\bseed words\b/i,
      /\bsecret phrase\b/i,
      /\bmnemonic\b/i,
      /\b12 words\b/i,
      /\b24 words\b/i,
      /cụm từ khôi phục/i,
      /mã khôi phục/i,
    ]) ||
    looksLikePotentialMnemonic(rawInput)
  ) {
    add(
      "wallet_secret_seed_phrase",
      "Seed phrase / mnemonic / recovery words related input detected",
    );

    return {
      detected: true,
      sensitiveType: "seed_phrase",
      matchedRules,
    };
  }

  if (
    hasMatch(raw, [
      /\brecovery phrase\b/i,
      /\brecovery words\b/i,
      /cụm từ khôi phục/i,
      /mã khôi phục/i,
    ])
  ) {
    add(
      "wallet_secret_recovery_phrase",
      "Recovery phrase related input detected",
    );

    return {
      detected: true,
      sensitiveType: "recovery_phrase",
      matchedRules,
    };
  }

  if (
    hasMatch(raw, [
      /\bprivate key\b/i,
      /\bsecret key\b/i,
      /\bwallet key\b/i,
      /khóa riêng tư/i,
      /khoa rieng tu/i,
    ])
  ) {
    add("wallet_secret_private_key", "Private key related input detected");

    return {
      detected: true,
      sensitiveType: "private_key",
      matchedRules,
    };
  }

  if (
    hasMatch(raw, [
      /\bpassword\b/i,
      /\bpasscode\b/i,
      /\blogin code\b/i,
      /\botp\b/i,
      /\b2fa\b/i,
      /\bauthentication code\b/i,
    ])
  ) {
    add("credential_or_otp", "Password / OTP / authentication code detected");

    return {
      detected: true,
      sensitiveType:
        raw.includes("otp") || raw.includes("2fa") ? "otp" : "password",
      matchedRules,
    };
  }

  return {
    detected: false,
    sensitiveType: null,
    matchedRules,
  };
}

export function detectBasicScamPatterns(rawInput: string): {
  matchedRules: ScamAlertRuleMatch[];
  highestRiskLevel: ScamAlertRiskLevel;
  confidence: ScamAlertConfidence;
} {
  const raw = normalizeText(rawInput);
  const matchedRules: ScamAlertRuleMatch[] = [];

  const add = (
    id: string,
    label: string,
    severity: ScamAlertRiskLevel = "medium",
  ) => {
    if (!matchedRules.some((item) => item.id === id)) {
      matchedRules.push({ id, label, severity });
    }
  };

  if (
    hasMatch(raw, [
      /\bguaranteed profit\b/i,
      /\bguaranteed return\b/i,
      /lợi nhuận đảm bảo/i,
      /loi nhuan dam bao/i,
    ])
  ) {
    add("guaranteed_profit", "Guaranteed profit or return", "high");
  }

  if (
    hasMatch(raw, [
      /\b\d+(\.\d+)?%\s*(daily|per day|a day)\b/i,
      /\bdaily roi\b/i,
      /\bdaily return\b/i,
      /lãi mỗi ngày/i,
      /lai moi ngay/i,
    ])
  ) {
    add("daily_roi", "Unrealistic daily return / ROI", "high");
  }

  if (
    hasMatch(raw, [
      /\bdouble your money\b/i,
      /\bx2\b/i,
      /\b2x\b/i,
      /nhân đôi tiền/i,
      /nhan doi tien/i,
    ])
  ) {
    add("double_money", "Double-your-money claim", "high");
  }

  if (
    hasMatch(raw, [
      /\bdeposit to withdraw\b/i,
      /\bpay.*fee.*withdraw\b/i,
      /\bpay.*fee.*unlock\b/i,
      /\bunlock.*reward\b/i,
      /nạp.*rút/i,
      /nap.*rut/i,
      /phí.*mở khóa/i,
      /phi.*mo khoa/i,
    ])
  ) {
    add("pay_to_unlock", "Payment required to unlock funds or rewards", "high");
  }

  if (
    hasMatch(raw, [
      /\bconnect wallet\b/i,
      /\bwallet connect\b/i,
      /\bverify wallet\b/i,
      /\bconnect.*claim\b/i,
      /\bclaim reward\b/i,
      /\bclaim airdrop\b/i,
      /kết nối ví/i,
      /ket noi vi/i,
      /xác minh ví/i,
      /xac minh vi/i,
    ])
  ) {
    add(
      "wallet_connection_for_reward",
      "Wallet connection requested for reward or verification",
      "high",
    );
  }

  if (
    hasMatch(raw, [
      /\burgent\b/i,
      /\bimmediately\b/i,
      /\bright now\b/i,
      /\bnow\b/i,
      /khẩn cấp/i,
      /khan cap/i,
      /ngay lập tức/i,
      /ngay lap tuc/i,
    ])
  ) {
    add("urgency_language", "Urgency pressure detected", "medium");
  }

  if (
    hasMatch(raw, [
      /\banonymous team\b/i,
      /\bunknown team\b/i,
      /ẩn danh/i,
      /an danh/i,
    ])
  ) {
    add("anonymous_team", "Anonymous or unclear team", "medium");
  }

  if (
    hasMatch(raw, [
      /\bunclear tokenomics\b/i,
      /\bno tokenomics\b/i,
      /\btokenomics unclear\b/i,
      /tokenomics không rõ/i,
      /tokenomics khong ro/i,
    ])
  ) {
    add("unclear_tokenomics", "Unclear tokenomics", "medium");
  }

  const hasHigh = matchedRules.some((item) => item.severity === "high");

  return {
    matchedRules,
    highestRiskLevel: hasHigh
      ? "high"
      : matchedRules.length > 0
        ? "medium"
        : "low",
    confidence:
      matchedRules.length >= 2
        ? "high"
        : matchedRules.length === 1
          ? "medium"
          : "low",
  };
}

export function isContractAddressOnly(rawInput: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(rawInput || "").trim());
}

export function isLikelyDataCheckQuestion(rawInput: string) {
  const raw = normalizeText(rawInput);

  if (isContractAddressOnly(rawInput)) return true;

  return hasMatch(raw, [
    /\bcontract address\b/i,
    /\bhoneypot\b/i,
    /\bliquidity lock\b/i,
    /\blocked liquidity\b/i,
    /\bmint permission\b/i,
    /\bdomain age\b/i,
    /\bfake followers\b/i,
    /\btwitter bot\b/i,
  ]);
}

export function isCryptoEducationQuestion(rawInput: string) {
  const raw = normalizeText(rawInput);

  return hasMatch(raw, [
    /^what is gas fee\??$/i,
    /\bwhat is gas fee\b/i,
    /\bexplain gas fee\b/i,
    /\bwhat is blockchain\b/i,
    /\bwhat is wallet\b/i,
  ]);
}

export function getWordCount(rawInput: string) {
  return countWords(rawInput);
}
