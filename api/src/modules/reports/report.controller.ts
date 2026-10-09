import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiSuccessBody, PaginatedBody } from '../../shared/types/api.types.js';
import { caller } from '../../shared/utils/caller.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { paginatedResponse, successResponse } from '../../shared/utils/response.js';
import type { ReportService } from './report.service.js';
import type { CreateReportBody, ListReportsQuery, Report } from './report.types.js';

export function createReportController(service: ReportService) {
  return {
    async list(request: FastifyRequest<{ Querystring: ListReportsQuery }>, _reply: FastifyReply): Promise<PaginatedBody<Report>> {
      const { accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.list(accessToken, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async create(request: FastifyRequest<{ Body: CreateReportBody }>, reply: FastifyReply): Promise<ApiSuccessBody<Report>> {
      const { user, accessToken } = caller(request);
      const report = await service.create(accessToken, user.id, request.body);
      reply.code(201);
      return successResponse(report);
    },
  };
}
