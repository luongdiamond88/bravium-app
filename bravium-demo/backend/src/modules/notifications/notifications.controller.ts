import type { FastifyReply, FastifyRequest } from "fastify";
import {
  createNotificationSchema,
  notificationsByUserParamsSchema,
} from "./notifications.schema";
import {
  createNotificationService,
  getNotificationsByUserIdService,
} from "./notifications.service";

export async function createNotificationController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = createNotificationSchema.parse(request.body);
  const notification = await createNotificationService(body);

  return reply.code(201).send({
    ok: true,
    notification,
  });
}

export async function getNotificationsByUserController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const params = notificationsByUserParamsSchema.parse(request.params);
  const notifications = await getNotificationsByUserIdService(params.userId);

  return reply.send({
    ok: true,
    userId: params.userId,
    notifications,
  });
}
