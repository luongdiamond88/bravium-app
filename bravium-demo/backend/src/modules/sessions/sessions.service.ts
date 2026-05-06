import type { CreateSessionInput } from "./sessions.schema";
import {
  createSession,
  findSessionByFrontendSessionId,
  getSessionById,
} from "./sessions.repo";

export async function createSessionService(input: CreateSessionInput) {
  if (input.frontendSessionId) {
    const existing = await findSessionByFrontendSessionId(input.frontendSessionId);
    if (existing) return existing;
  }

  return createSession(input);
}

export async function getSessionByIdService(id: string) {
  return getSessionById(id);
}