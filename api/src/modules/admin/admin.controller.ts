import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiSuccessBody, PaginatedBody } from '../../shared/types/api.types.js';
import { caller } from '../../shared/utils/caller.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { paginatedResponse, successResponse } from '../../shared/utils/response.js';
import type { AdminService } from './admin.service.js';
import type { AdminDashboard, ListUsersQuery, Profile, UpdateUserStatusBody, UserIdParams } from './admin.types.js';

/** HTTP layer for administration. The caller's identity comes from the verified token, never from the request. */
export function createAdminController(service: AdminService) {
  return {
    async dashboard(request: FastifyRequest, _reply: FastifyReply): Promise<ApiSuccessBody<AdminDashboard>> {
      const { accessToken } = caller(request);
      return successResponse(await service.dashboard(accessToken));
    },

    async listUsers(
      request: FastifyRequest<{ Querystring: ListUsersQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<Profile>> {
      const { accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { role, status, search } = request.query;
      const { items, total } = await service.listUsers(accessToken, { role, status, search }, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async updateUserStatus(
      request: FastifyRequest<{ Params: UserIdParams; Body: UpdateUserStatusBody }>,
      _reply: FastifyReply,
    ): Promise<ApiSuccessBody<Profile>> {
      const { user, accessToken } = caller(request);
      return successResponse(await service.updateUserStatus(accessToken, user.id, request.params.id, request.body));
    },
  };
}

export type AdminController = ReturnType<typeof createAdminController>;
