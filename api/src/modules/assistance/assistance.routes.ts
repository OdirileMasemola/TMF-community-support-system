import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { createAssistanceController } from './assistance.controller.js';
import {
  createDocumentSchema,
  createRequestSchema,
  createScheduleSchema,
  getRequestSchema,
  listMyRequestsSchema,
  listMySchedulesSchema,
  listRequestsSchema,
  listSchedulesSchema,
  updateRequestStatusSchema,
} from './assistance.schema.js';
import { createAssistanceService } from './assistance.service.js';
import type {
  AssistanceIdParams,
  CreateAssistanceRequestBody,
  CreateDocumentBody,
  CreateScheduleBody,
  ListRequestsQuery,
  ListSchedulesQuery,
  MySchedulesQuery,
  UpdateRequestStatusBody,
} from './assistance.types.js';

/**
 * Assistance routes, registered at /api/v1 (they span /assistance-requests, /collection-schedules
 * and /admin/...). Route -> Controller -> Service -> user-scoped Supabase client (RLS applies).
 *
 * Beneficiary endpoints need the beneficiary role, admin endpoints the administrator role.
 * GET /assistance-requests/:id is open to any signed-in account; RLS ("Beneficiaries and admins view
 * assistance requests") only returns the request to its beneficiary and to administrators.
 */
export async function assistanceRoutes(app: FastifyInstance): Promise<void> {
  const controller = createAssistanceController(createAssistanceService({ createUserClient: app.createUserClient }));
  const beneficiaryOnly = [authenticate, requireRole('beneficiary')];
  const adminOnly = [authenticate, requireRole('administrator')];

  app.post<{ Body: CreateAssistanceRequestBody }>(
    '/assistance-requests',
    { preValidation: beneficiaryOnly, schema: createRequestSchema },
    controller.create,
  );
  app.get<{ Querystring: ListRequestsQuery }>(
    '/assistance-requests',
    { preValidation: adminOnly, schema: listRequestsSchema },
    controller.list,
  );
  app.get<{ Querystring: ListRequestsQuery }>(
    '/assistance-requests/me',
    { preValidation: beneficiaryOnly, schema: listMyRequestsSchema },
    controller.listMine,
  );
  app.get<{ Params: AssistanceIdParams }>(
    '/assistance-requests/:id',
    { preValidation: [authenticate], schema: getRequestSchema },
    controller.getById,
  );
  app.post<{ Params: AssistanceIdParams; Body: CreateDocumentBody }>(
    '/assistance-requests/:id/documents',
    { preValidation: beneficiaryOnly, schema: createDocumentSchema },
    controller.addDocument,
  );
  app.patch<{ Params: AssistanceIdParams; Body: UpdateRequestStatusBody }>(
    '/admin/assistance-requests/:id',
    { preValidation: adminOnly, schema: updateRequestStatusSchema },
    controller.updateStatus,
  );
  app.post<{ Body: CreateScheduleBody }>(
    '/admin/collection-schedules',
    { preValidation: adminOnly, schema: createScheduleSchema },
    controller.createSchedule,
  );
  app.get<{ Querystring: ListSchedulesQuery }>(
    '/admin/collection-schedules',
    { preValidation: adminOnly, schema: listSchedulesSchema },
    controller.listSchedules,
  );
  app.get<{ Querystring: MySchedulesQuery }>(
    '/collection-schedules/me',
    { preValidation: beneficiaryOnly, schema: listMySchedulesSchema },
    controller.listMySchedules,
  );
}
