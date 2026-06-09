import {
  AiJobStatus,
  AiJobType,
  AiOutputType,
  ApprovalStatus,
  DevicePlatform,
  DeviceStatus,
  NotificationStatus,
  NotificationType,
  PrismaClient,
  SessionStatus,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@bravium.ai" },
    update: {
      name: "Demo User",
      role: UserRole.USER,
    },
    create: {
      email: "demo@bravium.ai",
      name: "Demo User",
      role: UserRole.USER,
    },
  });

  const investorUser = await prisma.user.upsert({
    where: { email: "investor@bravium.ai" },
    update: {
      name: "Investor Viewer",
      role: UserRole.INVESTOR,
    },
    create: {
      email: "investor@bravium.ai",
      name: "Investor Viewer",
      role: UserRole.INVESTOR,
    },
  });

  await prisma.notification.deleteMany({
    where: { userId: demoUser.id },
  });

  await prisma.approval.deleteMany({
    where: { userId: demoUser.id },
  });

  await prisma.aiOutput.deleteMany({
    where: { userId: demoUser.id },
  });

  await prisma.aiJob.deleteMany({
    where: { userId: demoUser.id },
  });

  await prisma.eventLog.deleteMany({
    where: { userId: demoUser.id },
  });

  await prisma.session.deleteMany({
    where: { userId: demoUser.id },
  });

  await prisma.device.deleteMany({
    where: { userId: demoUser.id },
  });

  const device = await prisma.device.create({
    data: {
      userId: demoUser.id,
      deviceCode: "BRV-DEMO-001",
      label: "Bravium Demo Robot",
      platform: DevicePlatform.WEB,
      status: DeviceStatus.ACTIVE,
    },
  });

  const session = await prisma.session.create({
    data: {
      userId: demoUser.id,
      deviceId: device.id,
      frontendSessionId: "demo_session_frontend_001",
      status: SessionStatus.OPEN,
      metadata: {
        entry: "power_on",
        demoMode: true,
      },
    },
  });

  const eventData = [
    {
      type: "first_power_on_confirmed",
      source: "powerOn",
      category: "checkpoint",
      payload: { page: "powerOn" },
    },
    {
      type: "ai_activation_confirmed",
      source: "dashboard",
      category: "checkpoint",
      payload: { mode: "brc_earning" },
    },
    {
      type: "first_brc_mining_confirmed",
      source: "dashboard",
      category: "checkpoint",
      payload: { brc: 0.126 },
    },
    {
      type: "physical_confirm_requested",
      source: "device",
      category: "device",
      payload: { checkpoint: "first_history_record", page: "dashboard" },
    },
    {
      type: "physical_confirm_received",
      source: "device",
      category: "device",
      payload: {
        checkpoint: "first_history_record",
        method: "physical_button",
      },
    },
    {
      type: "first_history_record_confirmed",
      source: "dashboard",
      category: "checkpoint",
      payload: {
        action: "earn_more_brc",
        message: "Your history has begun",
      },
    },
    {
      type: "brc_to_eth_transfer_confirmed",
      source: "stake",
      category: "checkpoint",
      payload: { stakeAmount: 100, assetFrom: "BRC", assetTo: "ETH" },
    },
    {
      type: "eth_claim_confirmed",
      source: "stake",
      category: "checkpoint",
      payload: { claimAmount: 0.015, token: "ETH" },
    },
    {
      type: "first_economic_cycle_confirmed",
      source: "stake",
      category: "checkpoint",
      payload: { cycleId: "cycle_demo_001" },
    },
    {
      type: "ai_job_created",
      source: "ai.scam-alert",
      category: "ai",
      payload: { jobType: "scam_alert" },
    },
    {
      type: "ai_analysis_started",
      source: "ai.scam-alert",
      category: "ai",
      payload: { jobType: "scam_alert" },
    },
    {
      type: "ai_analysis_completed",
      source: "ai.scam-alert",
      category: "ai",
      payload: { result: "completed" },
    },
    {
      type: "ai_alert_generated",
      source: "ai.scam-alert",
      category: "ai",
      payload: { riskLevel: "high" },
    },
    {
      type: "user_approval_requested",
      source: "approvals",
      category: "control",
      payload: { actionType: "claim_eth" },
    },
    {
      type: "user_approved",
      source: "approvals",
      category: "control",
      payload: { actionType: "claim_eth" },
    },
    {
      type: "action_executed",
      source: "approvals",
      category: "control",
      payload: { actionType: "claim_eth" },
    },
    {
      type: "reminder_scheduled",
      source: "notifications",
      category: "finance",
      payload: { title: "School fee due" },
    },
    {
      type: "budget_alert_generated",
      source: "notifications",
      category: "finance",
      payload: { title: "Budget threshold reached" },
    },
  ];

  for (const event of eventData) {
    await prisma.eventLog.create({
      data: {
        userId: demoUser.id,
        deviceId: device.id,
        sessionId: session.id,
        type: event.type,
        source: event.source,
        category: event.category,
        payload: event.payload,
      },
    });
  }

  const aiJob = await prisma.aiJob.create({
    data: {
      userId: demoUser.id,
      sessionId: session.id,
      type: AiJobType.SCAM_ALERT,
      status: AiJobStatus.COMPLETED,
      input: {
        messageText:
          "Please send your seed phrase now to verify wallet and claim reward",
      },
      startedAt: new Date(),
      completedAt: new Date(),
    },
  });

  await prisma.aiOutput.create({
    data: {
      jobId: aiJob.id,
      userId: demoUser.id,
      outputType: AiOutputType.ALERT,
      content: {
        riskLevel: "high",
        summary: "High-risk scam pattern detected.",
        recommendation: "Block action and require user approval.",
      },
    },
  });

  await prisma.approval.create({
    data: {
      userId: demoUser.id,
      sessionId: session.id,
      actionType: "claim_eth",
      status: ApprovalStatus.APPROVED,
      requestPayload: {
        amount: "0.015",
        token: "ETH",
      },
      decidedAt: new Date(),
      decisionReason: "user confirmed on dashboard",
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: demoUser.id,
        type: NotificationType.REMINDER,
        title: "School fee due",
        body: "Pay school fee tomorrow",
        status: NotificationStatus.PENDING,
        scheduledFor: new Date("2026-05-07T08:00:00.000Z"),
        payload: {
          category: "school_fee",
        },
      },
      {
        userId: demoUser.id,
        type: NotificationType.BUDGET_ALERT,
        title: "Budget threshold reached",
        body: "You are close to your monthly household budget",
        status: NotificationStatus.PENDING,
        payload: {
          budget: 3000,
          spent: 100,
        },
      },
    ],
  });

  console.log("✅ Demo seed completed");
  console.log({
    demoUserId: demoUser.id,
    investorUserId: investorUser.id,
    deviceId: device.id,
    sessionId: session.id,
  });
}

main()
  .catch((error) => {
    console.error("❌ Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
