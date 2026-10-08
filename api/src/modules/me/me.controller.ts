import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiSuccessBody } from '../../shared/types/api.types.js';
import { caller } from '../../shared/utils/caller.js';
import { successResponse } from '../../shared/utils/response.js';
import type { MeService } from './me.service.js';
import type { CompleteProfileBody, Me, UpdateMeBody, UpdateSettingsBody, UserSettings } from './me.types.js';

/** HTTP layer for /me. The user id always comes from the verified token, never from the request. */
export function createMeController(service: MeService) {
  return {
    async get(request: FastifyRequest, _reply: FastifyReply): Promise<ApiSuccessBody<Me>> {
      const { user, accessToken } = caller(request);
      return successResponse(await service.get(accessToken, user));
    },

    async update(request: FastifyRequest<{ Body: UpdateMeBody }>, _reply: FastifyReply): Promise<ApiSuccessBody<Me>> {
      const { user, accessToken } = caller(request);
      return successResponse(await service.update(accessToken, user, request.body));
    },

    async completeProfile(
      request: FastifyRequest<{ Body: CompleteProfileBody }>,
      reply: FastifyReply,
    ): Promise<ApiSuccessBody<Me>> {
      const { user, accessToken } = caller(request);
      const me = await service.completeProfile(accessToken, user, request.body);
      reply.status(201);
      return successResponse(me);
    },

    async getSettings(request: FastifyRequest, _reply: FastifyReply): Promise<ApiSuccessBody<UserSettings>> {
      const { user, accessToken } = caller(request);
      return successResponse(await service.getSettings(accessToken, user.id));
    },

    async updateSettings(
      request: FastifyRequest<{ Body: UpdateSettingsBody }>,
      _reply: FastifyReply,
    ): Promise<ApiSuccessBody<UserSettings>> {
      const { user, accessToken } = caller(request);
      return successResponse(await service.updateSettings(accessToken, user.id, request.body));
    },
  };
}

export type MeController = ReturnType<typeof createMeController>;
