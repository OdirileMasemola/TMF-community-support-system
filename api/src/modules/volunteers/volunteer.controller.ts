import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiSuccessBody, PaginatedBody, PaginationMeta } from '../../shared/types/api.types.js';
import { caller } from '../../shared/utils/caller.js';
import { buildPaginationMeta, parsePagination, type PaginationQuery } from '../../shared/utils/pagination.js';
import { paginatedResponse, successResponse } from '../../shared/utils/response.js';
import type { VolunteerService } from './volunteer.service.js';
import type {
  AdminApplication,
  AdminHours,
  CampaignApplication,
  CreateApplicationBody,
  CreateHoursBody,
  HoursTotals,
  ListApplicationsQuery,
  ListHoursQuery,
  MyApplication,
  MyApplicationsQuery,
  MyAssignment,
  MyAssignmentsQuery,
  Opportunity,
  ReviewApplicationBody,
  ReviewedApplication,
  VolunteerHours,
  VolunteerIdParams,
} from './volunteer.types.js';

type MyHoursBody = PaginatedBody<VolunteerHours> & { meta: PaginationMeta & HoursTotals };

/** HTTP layer for volunteers. The caller's identity comes from the verified token, never from the request. */
export function createVolunteerController(service: VolunteerService) {
  return {
    async listOpportunities(
      request: FastifyRequest<{ Querystring: PaginationQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<Opportunity>> {
      const { user, accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.listOpportunities(accessToken, user.id, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async apply(
      request: FastifyRequest<{ Body: CreateApplicationBody }>,
      reply: FastifyReply,
    ): Promise<ApiSuccessBody<CampaignApplication>> {
      const { user, accessToken } = caller(request);
      const application = await service.apply(accessToken, user.id, request.body);
      reply.code(201);
      return successResponse(application);
    },

    async listApplications(
      request: FastifyRequest<{ Querystring: ListApplicationsQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<AdminApplication>> {
      const { accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const filters = { status: request.query.status, campaignId: request.query.campaign_id };
      const { items, total } = await service.listApplications(accessToken, filters, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async listMyApplications(
      request: FastifyRequest<{ Querystring: MyApplicationsQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<MyApplication>> {
      const { user, accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.listMyApplications(accessToken, user.id, request.query.status, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async reviewApplication(
      request: FastifyRequest<{ Params: VolunteerIdParams; Body: ReviewApplicationBody }>,
      _reply: FastifyReply,
    ): Promise<ApiSuccessBody<ReviewedApplication>> {
      const { accessToken } = caller(request);
      return successResponse(await service.reviewApplication(accessToken, request.params.id, request.body));
    },

    async listMyAssignments(
      request: FastifyRequest<{ Querystring: MyAssignmentsQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<MyAssignment>> {
      const { user, accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.listMyAssignments(accessToken, user.id, request.query.status, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async recordHours(
      request: FastifyRequest<{ Body: CreateHoursBody }>,
      reply: FastifyReply,
    ): Promise<ApiSuccessBody<VolunteerHours>> {
      const { user, accessToken } = caller(request);
      const entry = await service.recordHours(accessToken, user.id, request.body);
      reply.code(201);
      return successResponse(entry);
    },

    async listHours(
      request: FastifyRequest<{ Querystring: ListHoursQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<AdminHours>> {
      const { accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.listHours(accessToken, request.query.volunteer_id, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async listMyHours(request: FastifyRequest<{ Querystring: PaginationQuery }>, _reply: FastifyReply): Promise<MyHoursBody> {
      const { user, accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total, totalHours, thisMonthHours } = await service.listMyHours(accessToken, user.id, pagination);
      return { data: items, meta: { ...buildPaginationMeta(total, pagination), totalHours, thisMonthHours } };
    },
  };
}

export type VolunteerController = ReturnType<typeof createVolunteerController>;
