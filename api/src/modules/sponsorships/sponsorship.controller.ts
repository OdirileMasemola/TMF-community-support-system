import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiSuccessBody, PaginatedBody } from '../../shared/types/api.types.js';
import { caller } from '../../shared/utils/caller.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { paginatedResponse, successResponse } from '../../shared/utils/response.js';
import type { SponsorshipService } from './sponsorship.service.js';
import type {
  AdminSponsorship,
  CreateResponseBody,
  CreateSponsorshipBody,
  ListRequestsQuery,
  ListSponsorshipsQuery,
  MySponsorship,
  Sponsorship,
  SponsorshipIdParams,
  SponsorshipRequestWithCampaign,
  SponsorshipResponse,
} from './sponsorship.types.js';

/** HTTP layer for sponsorships. The caller's identity comes from the verified token, never from the request. */
export function createSponsorshipController(service: SponsorshipService) {
  return {
    async create(
      request: FastifyRequest<{ Body: CreateSponsorshipBody }>,
      reply: FastifyReply,
    ): Promise<ApiSuccessBody<Sponsorship>> {
      const { user, accessToken } = caller(request);
      const sponsorship = await service.create(accessToken, user.id, request.body);
      reply.code(201);
      return successResponse(sponsorship);
    },

    async list(
      request: FastifyRequest<{ Querystring: ListSponsorshipsQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<AdminSponsorship>> {
      const { accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.list(accessToken, request.query.status, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async listMine(
      request: FastifyRequest<{ Querystring: ListSponsorshipsQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<MySponsorship>> {
      const { user, accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.listMine(accessToken, user.id, request.query.status, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async listRequests(
      request: FastifyRequest<{ Querystring: ListRequestsQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<SponsorshipRequestWithCampaign>> {
      const { accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.listRequests(accessToken, request.query.status, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async respond(
      request: FastifyRequest<{ Params: SponsorshipIdParams; Body: CreateResponseBody }>,
      reply: FastifyReply,
    ): Promise<ApiSuccessBody<SponsorshipResponse>> {
      const { user, accessToken } = caller(request);
      const response = await service.respond(accessToken, user.id, request.params.id, request.body);
      reply.code(201);
      return successResponse(response);
    },
  };
}

export type SponsorshipController = ReturnType<typeof createSponsorshipController>;
