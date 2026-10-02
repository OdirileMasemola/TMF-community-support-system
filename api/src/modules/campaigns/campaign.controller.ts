import type { FastifyReply, FastifyRequest } from 'fastify';
import { extractBearerToken } from '../../middleware/authenticate.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import type { ApiSuccessBody, PaginatedBody } from '../../shared/types/api.types.js';
import type { AuthUser } from '../../shared/types/auth.types.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { paginatedResponse, successResponse } from '../../shared/utils/response.js';
import type { CampaignService } from './campaign.service.js';
import type {
  Campaign,
  CampaignIdParams,
  CreateCampaignBody,
  ListCampaignsQuery,
  UpdateCampaignBody,
} from './campaign.types.js';

/**
 * The caller's verified user and access token. `authenticate` has already verified the token;
 * it is re-read from the header only to build the user-scoped Supabase client.
 */
function caller(request: FastifyRequest): { user: AuthUser; accessToken: string } {
  const accessToken = extractBearerToken(request.headers.authorization);
  if (request.user === null || accessToken === null) {
    throw ApiError.unauthorized();
  }
  return { user: request.user, accessToken };
}

/** HTTP layer for campaigns. Role checks are done by the route preHandlers, not here. */
export function createCampaignController(service: CampaignService) {
  return {
    async list(
      request: FastifyRequest<{ Querystring: ListCampaignsQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<Campaign>> {
      const { accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.list(accessToken, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async getById(
      request: FastifyRequest<{ Params: CampaignIdParams }>,
      _reply: FastifyReply,
    ): Promise<ApiSuccessBody<Campaign>> {
      const { accessToken } = caller(request);
      return successResponse(await service.getById(accessToken, request.params.id));
    },

    async create(
      request: FastifyRequest<{ Body: CreateCampaignBody }>,
      reply: FastifyReply,
    ): Promise<ApiSuccessBody<Campaign>> {
      const { user, accessToken } = caller(request);
      const campaign = await service.create(accessToken, user.id, request.body);
      reply.status(201);
      return successResponse(campaign);
    },

    async update(
      request: FastifyRequest<{ Params: CampaignIdParams; Body: UpdateCampaignBody }>,
      _reply: FastifyReply,
    ): Promise<ApiSuccessBody<Campaign>> {
      const { accessToken } = caller(request);
      return successResponse(await service.update(accessToken, request.params.id, request.body));
    },

    async archive(
      request: FastifyRequest<{ Params: CampaignIdParams }>,
      _reply: FastifyReply,
    ): Promise<ApiSuccessBody<Campaign>> {
      const { accessToken } = caller(request);
      return successResponse(await service.archive(accessToken, request.params.id));
    },
  };
}

export type CampaignController = ReturnType<typeof createCampaignController>;
