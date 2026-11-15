import { randomUUID } from "crypto";
import type {
  SaveWalletSplitPlanInput,
  WalletSplitGuidanceRequestInput,
} from "./walletGuidance.schema";
import { createWalletGuidanceEventLog } from "./walletGuidance.repo";

function normalizeRiskLevel(value: string) {
  const raw = String(value || "").toLowerCase();

  if (raw === "low" || raw === "medium" || raw === "high") {
    return raw;
  }

  return "unknown";
}

function buildRiskAwareSummary(riskLevel: string) {
  if (riskLevel === "high") {
    return "High-risk context detected. Use wallet separation to protect main assets before interacting with any suspicious project.";
  }

  if (riskLevel === "medium") {
    return "Potential risk detected. Use wallet separation so normal interactions do not expose main assets.";
  }

  if (riskLevel === "low") {
    return "Even when no major risk is detected, wallet separation reduces damage if a future interaction becomes unsafe.";
  }

  return "Use three separate wallets to isolate main assets, daily interactions, and high-risk testing.";
}

function buildWalletSplitPlan(input: WalletSplitGuidanceRequestInput) {
  const riskLevelUsed = normalizeRiskLevel(input.riskLevel);
  const planId = `wallet_plan_${randomUUID()}`;
  const redFlags = Array.isArray(input.redFlags) ? input.redFlags : [];

  const needsUserAttention = riskLevelUsed === "high" || riskLevelUsed === "medium";

  return {
    planId,
    source: input.source,
    riskLevelUsed,
    generatedBy: "bravium_wallet_guidance_rule_engine_v1",
    summary: buildRiskAwareSummary(riskLevelUsed),
    scamAlertContext: {
      summary: input.scamAlertSummary || null,
      redFlags,
    },
    wallets: {
      vault: {
        label: "Vault Wallet",
        role: "main_vault",
        purpose: "Main long-term storage for assets the user does not want exposed.",
        useFor: [
          "Long-term holdings",
          "Main assets",
          "Assets that should not interact with unknown apps",
        ],
        avoidFor: [
          "Unknown dApps",
          "Airdrop claims",
          "New project testing",
          "Random links from Telegram, Discord, X, or DMs",
        ],
        controlRule:
          "Never connect the Vault Wallet to unknown websites, reward pages, or unverified contracts.",
      },
      interaction: {
        label: "Interaction Wallet",
        role: "hot_interaction",
        purpose: "Daily interaction wallet with limited funds.",
        useFor: [
          "Known dApps",
          "Routine wallet actions",
          "Small interactions where the user understands the risk",
        ],
        avoidFor: [
          "Large balances",
          "Long-term storage",
          "Unknown projects with unclear risk",
        ],
        controlRule:
          "Keep only limited funds here. If an action looks risky, move it to the Testing Wallet instead.",
      },
      testing: {
        label: "Testing / Risk Wallet",
        role: "risk_testing",
        purpose: "High-risk wallet for unknown projects, airdrops, and experiments.",
        useFor: [
          "Unknown projects",
          "Airdrop testing",
          "Contract interaction testing",
          "Cases flagged by Scam Alert",
        ],
        avoidFor: [
          "Main assets",
          "Savings",
          "Long-term holdings",
          "Funds the user cannot afford to lose",
        ],
        controlRule:
          "Only use funds the user is prepared to lose. Never import the Vault seed phrase here.",
      },
    },
    controlCheckpoints: [
      "Never share seed phrase, recovery phrase, private key, password, or OTP.",
      "Never connect Vault Wallet to unknown sites.",
      "Use Testing Wallet for unknown projects, airdrops, or suspicious links.",
      "Keep Interaction Wallet balance limited.",
      "If Scam Alert returns high risk, do not use the Vault Wallet.",
    ],
    suggestedNextActions: [
      "Label each wallet clearly: Vault, Interaction, Testing.",
      "Move main assets to the Vault Wallet.",
      "Use the Interaction Wallet only for known apps.",
      "Use the Testing Wallet for suspicious or unknown projects.",
      "Review every approval before signing.",
    ],
    needsUserAttention,
    needsUserApproval: false,
  };
}

export async function generateWalletSplitGuidanceService(
  input: WalletSplitGuidanceRequestInput
) {
  await createWalletGuidanceEventLog({
    userId: input.userId,
    sessionId: input.sessionId,
    type: "wallet_split_guidance_requested",
    source: "wallet.guidance",
    payload: {
      source: input.source,
      riskLevel: input.riskLevel,
      scamAlertSummaryProvided: Boolean(input.scamAlertSummary),
      redFlagCount: input.redFlags.length,
    },
  });

  const plan = buildWalletSplitPlan(input);

  await createWalletGuidanceEventLog({
    userId: input.userId,
    sessionId: input.sessionId,
    type: "wallet_split_guidance_generated",
    source: "wallet.guidance",
    payload: {
      planId: plan.planId,
      source: input.source,
      riskLevelUsed: plan.riskLevelUsed,
      walletRoles: ["main_vault", "hot_interaction", "risk_testing"],
      needsUserAttention: plan.needsUserAttention,
    },
  });

  return plan;
}

export async function saveWalletSplitPlanService(input: SaveWalletSplitPlanInput) {
  await createWalletGuidanceEventLog({
    userId: input.userId,
    sessionId: input.sessionId,
    type: "wallet_split_plan_saved",
    source: "wallet.guidance",
    payload: {
      planId: input.planId,
      source: input.source,
      understood: input.understood,
      savedAt: new Date().toISOString(),
    },
  });

  return {
    planId: input.planId,
    status: "saved",
    understood: input.understood,
  };
}