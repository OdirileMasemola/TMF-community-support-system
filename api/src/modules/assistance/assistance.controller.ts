import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiSuccessBody, PaginatedBody } from '../../shared/types/api.types.js';
import { caller } from '../../shared/utils/caller.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { paginatedResponse, successResponse } from '../../shared/utils/response.js';
import type { AssistanceService } from './assistance.service.js';
import type {
  AdminAssistanceRequest,
  AdminCollectionSchedule,
  AssistanceIdParams,
  AssistanceRequest,
  AssistanceRequestDetail,
  CollectionSchedule,
  CreateAssistanceRequestBody,
  CreateDocumentBody,
  CreateScheduleBody,
  ListRequestsQuery,
  ListSchedulesQuery,
  MyAssistanceRequest,
  MySchedulesQuery,
  SupportingDocument,
  UpdateRequestStatusBody,
} from './assistance.types.js';

/** HTTP layer for assistance. The caller's identity comes from the verified token, never from the request. */
export function createAssistanceController(service: AssistanceService) {
  return {
    async create(
      request: FastifyRequest<{ Body: CreateAssistanceRequestBody }>,
      reply: FastifyReply,
    ): Promise<ApiSuccessBody<AssistanceRequest>> {
      const { user, accessToken } = caller(request);
      const created = await service.create(accessToken, user.id, request.body);
      reply.code(201);
      return successResponse(created);
    },

    async list(
      request: FastifyRequest<{ Querystring: ListRequestsQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<AdminAssistanceRequest>> {
      const { accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.list(accessToken, request.query.status, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async listMine(
      request: FastifyRequest<{ Querystring: ListRequestsQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<MyAssistanceRequest>> {
      const { user, accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.listMine(accessToken, user.id, request.query.status, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async getById(
      request: FastifyRequest<{ Params: AssistanceIdParams }>,
      _reply: FastifyReply,
    ): Promise<ApiSuccessBody<AssistanceRequestDetail>> {
      const { accessToken } = caller(request);
      return successResponse(await service.getById(accessToken, request.params.id));
    },

    async addDocument(
      request: FastifyRequest<{ Params: AssistanceIdParams; Body: CreateDocumentBody }>,
      reply: FastifyReply,
    ): Promise<ApiSuccessBody<SupportingDocument>> {
      const { user, accessToken } = caller(request);
      const document = await service.addDocument(accessToken, user.id, request.params.id, request.body);
      reply.code(201);
      return successResponse(document);
    },

    async updateStatus(
      request: FastifyRequest<{ Params: AssistanceIdParams; Body: UpdateRequestStatusBody }>,
      _reply: FastifyReply,
    ): Promise<ApiSuccessBody<AssistanceRequestDetail>> {
      const { user, accessToken } = caller(request);
      return successResponse(await service.updateStatus(accessToken, user.id, request.params.id, request.body));
    },

    async createSchedule(
      request: FastifyRequest<{ Body: CreateScheduleBody }>,
      reply: FastifyReply,
    ): Promise<ApiSuccessBody<CollectionSchedule>> {
      const { accessToken } = caller(request);
      const schedule = await service.createSchedule(accessToken, request.body);
      reply.code(201);
      return successResponse(schedule);
    },

    async listSchedules(
      request: FastifyRequest<{ Querystring: ListSchedulesQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<AdminCollectionSchedule>> {
      const { accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const filters = { status: request.query.status, requestId: request.query.request_id };
      const { items, total } = await service.listSchedules(accessToken, filters, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async listMySchedules(
      request: FastifyRequest<{ Querystring: MySchedulesQuery }>,
      _reply: FastifyReply,
    ): Promise<PaginatedBody<CollectionSchedule>> {
      const { user, accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.listMySchedules(accessToken, user.id, request.query.status, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },
  };
}

export type AssistanceController = ReturnType<typeof createAssistanceController>;
