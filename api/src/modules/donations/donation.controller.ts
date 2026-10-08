import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiSuccessBody, PaginatedBody } from '../../shared/types/api.types.js';
import { caller } from '../../shared/utils/caller.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { paginatedResponse, successResponse } from '../../shared/utils/response.js';
import type { DonationService } from './donation.service.js';
import type {
  CreateDonationBody,
  CreateProofBody,
  Donation,
  DonationIdParams,
  DonationProof,
  ListMyDonationsQuery,
  ListProofsQuery,
  MyDonation,
  ReviewProof,
  ReviewProofBody,
} from './donation.types.js';

/** HTTP layer for donations. The caller's identity comes from the verified token, never from the request. */
export function createDonationController(service: DonationService) {
  return {
    async create(
      request: FastifyRequest<{ Body: CreateDonationBody }>,
      reply: FastifyReply,
    ): Promise<ApiSuccessBody<Donation>> {
      const { user, accessToken } = caller(request);
      const donation = await service.create(accessToken, user.id, request.body);
      reply.code(201);
      return successResponse(donation);
    },

    async listMine(
      request: FastifyRequest<{ Querystring: ListMyDonationsQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<MyDonation>> {
      const { user, accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.listMine(accessToken, user.id, request.query.status, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async addProof(
      request: FastifyRequest<{ Params: DonationIdParams; Body: CreateProofBody }>,
      reply: FastifyReply,
    ): Promise<ApiSuccessBody<DonationProof>> {
      const { user, accessToken } = caller(request);
      const proof = await service.addProof(accessToken, user.id, request.params.id, request.body);
      reply.code(201);
      return successResponse(proof);
    },

    async listProofs(
      request: FastifyRequest<{ Querystring: ListProofsQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<ReviewProof>> {
      const { accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.listProofs(accessToken, request.query.status, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async reviewProof(
      request: FastifyRequest<{ Params: DonationIdParams; Body: ReviewProofBody }>,
      _reply: FastifyReply,
    ): Promise<ApiSuccessBody<ReviewProof>> {
      const { user, accessToken } = caller(request);
      return successResponse(await service.reviewProof(accessToken, user.id, request.params.id, request.body));
    },
  };
}

export type DonationController = ReturnType<typeof createDonationController>;
