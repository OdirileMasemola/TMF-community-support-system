import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiSuccessBody, PaginatedBody } from '../../shared/types/api.types.js';
import { caller } from '../../shared/utils/caller.js';
import { buildPaginationMeta, parsePagination } from '../../shared/utils/pagination.js';
import { paginatedResponse, successResponse } from '../../shared/utils/response.js';
import type { EventService } from './event.service.js';
import type { CreateEventBody, Event, EventIdParams, ListEventsQuery, UpdateEventBody } from './event.types.js';

export function createEventController(service: EventService) {
  return {
    async list(request: FastifyRequest<{ Querystring: ListEventsQuery }>, _reply: FastifyReply): Promise<PaginatedBody<Event>> {
      const { accessToken } = caller(request);
      const pagination = parsePagination(request.query);
      const { items, total } = await service.list(accessToken, request.query.status, pagination);
      return paginatedResponse(items, buildPaginationMeta(total, pagination));
    },

    async create(request: FastifyRequest<{ Body: CreateEventBody }>, reply: FastifyReply): Promise<ApiSuccessBody<Event>> {
      const { user, accessToken } = caller(request);
      const event = await service.create(accessToken, user.id, request.body);
      reply.code(201);
      return successResponse(event);
    },

    async update(
      request: FastifyRequest<{ Params: EventIdParams; Body: UpdateEventBody }>,
      _reply: FastifyReply,
    ): Promise<ApiSuccessBody<Event>> {
      const { accessToken } = caller(request);
      return successResponse(await service.update(accessToken, request.params.id, request.body));
    },
  };
}
