import type { CreateCommunityRequestInput } from "./community.schema";
import {
  createCommunityEventLog,
  createCommunityRequest,
} from "./community.repo";

export async function createCommunityRequestService(
  input: CreateCommunityRequestInput,
) {
  try {
    const request = await createCommunityRequest(input);

    await createCommunityEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "community_request_created",
      source: "community.request",
      payload: {
        feature: "ask_bravium_community",
        source: input.source,
        riskLevel: input.riskLevel,
        communityRequestId: request.id,
      },
    });

    await createCommunityEventLog({
      userId: input.userId,
      sessionId: input.sessionId,
      type: "community_request_submitted",
      source: "community.request",
      payload: {
        feature: "ask_bravium_community",
        source: input.source,
        riskLevel: input.riskLevel,
        communityRequestId: request.id,
        status: request.status,
      },
    });

    return request;
  } catch (error) {
    try {
      await createCommunityEventLog({
        userId: input.userId,
        sessionId: input.sessionId,
        type: "community_request_failed",
        source: "community.request",
        payload: {
          feature: "ask_bravium_community",
          source: input.source,
          reason: error instanceof Error ? error.message : "unknown_error",
        },
      });
    } catch {
      // swallow secondary logging error for v1
    }

    throw error;
  }
}
