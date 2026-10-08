import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiSuccessBody, PaginatedBody, PaginationMeta } from '../../shared/types/api.types.js';
import { caller } from '../../shared/utils/caller.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { successResponse } from '../../shared/utils/response.js';
import type { NotificationService } from './notification.service.js';
import type { ListNotificationsQuery, Notification, NotificationIdParams } from './notification.types.js';

type NotificationListBody = PaginatedBody<Notification> & { meta: PaginationMeta & { unreadCount: number } };

/** HTTP layer for notifications. The user id comes from the verified token, never from the request. */
export function createNotificationController(service: NotificationService) {
  return {
    async list(
      request: FastifyRequest<{ Querystring: ListNotificationsQuery }>,
      _reply: FastifyReply,
    ): Promise<NotificationListBody> {
      const { user, accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total, unreadCount } = await service.list(accessToken, user.id, request.query.status, pagination);
      return { data: items, meta: { ...buildPaginationMeta(total, pagination), unreadCount } };
    },

    async markRead(
      request: FastifyRequest<{ Params: NotificationIdParams }>,
      _reply: FastifyReply,
    ): Promise<ApiSuccessBody<Notification>> {
      const { user, accessToken } = caller(request);
      return successResponse(await service.markRead(accessToken, user.id, request.params.id));
    },

    async markAllRead(request: FastifyRequest, _reply: FastifyReply): Promise<ApiSuccessBody<{ updated: number }>> {
      const { user, accessToken } = caller(request);
      return successResponse({ updated: await service.markAllRead(accessToken, user.id) });
    },
  };
}

export type NotificationController = ReturnType<typeof createNotificationController>;
