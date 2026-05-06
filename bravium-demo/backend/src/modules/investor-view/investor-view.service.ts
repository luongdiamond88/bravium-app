import {
  getInvestorAiJobs,
  getInvestorApprovals,
  getInvestorEvents,
  getInvestorSessions,
  getInvestorUser,
} from "./investor-view.repo";

type GetInvestorLogsServiceInput = {
  userId: string;
  sessionId?: string;
  limit: number;
};

export async function getInvestorLogsService(
  input: GetInvestorLogsServiceInput,
) {
  const [user, sessions, events, aiJobs, approvals] = await Promise.all([
    getInvestorUser(input.userId),
    getInvestorSessions(input.userId, input.sessionId),
    getInvestorEvents(input),
    getInvestorAiJobs(input),
    getInvestorApprovals(input),
  ]);

  if (!user) {
    return null;
  }

  const summary = {
    sessionCount: sessions.length,
    eventCount: events.length,
    aiJobCount: aiJobs.length,
    approvalCount: approvals.length,
    latestEventAt: events.length > 0 ? events[0].createdAt : null,
    latestAiJobAt: aiJobs.length > 0 ? aiJobs[0].createdAt : null,
    latestApprovalAt: approvals.length > 0 ? approvals[0].createdAt : null,
  };

  return {
    user,
    sessions,
    events,
    aiJobs,
    approvals,
    summary,
  };
}
