import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import type { PaginationQuery } from '../../shared/utils/pagination.js';
import { createVolunteerController } from './volunteer.controller.js';
import {
  applySchema,
  listApplicationsSchema,
  listHoursSchema,
  listMyApplicationsSchema,
  listMyAssignmentsSchema,
  listMyHoursSchema,
  listOpportunitiesSchema,
  recordHoursSchema,
  reviewApplicationSchema,
} from './volunteer.schema.js';
import { createVolunteerService } from './volunteer.service.js';
import type {
  CreateApplicationBody,
  CreateHoursBody,
  ListApplicationsQuery,
  ListHoursQuery,
  MyApplicationsQuery,
  MyAssignmentsQuery,
  ReviewApplicationBody,
  VolunteerIdParams,
} from './volunteer.types.js';

/**
 * Volunteer routes, registered at /api/v1 (they span /volunteer, /campaign-applications,
 * /volunteer-assignments, /volunteer-hours and /admin/...).
 * Route -> Controller -> Service -> user-scoped Supabase client (RLS applies).
 *
 * Volunteer endpoints need the volunteer role, admin endpoints (the plain list GETs and /admin/...)
 * the administrator role.
 */
export async function volunteerRoutes(app: FastifyInstance): Promise<void> {
  const controller = createVolunteerController(createVolunteerService({ createUserClient: app.createUserClient }));
  const volunteerOnly = [authenticate, requireRole('volunteer')];
  const adminOnly = [authenticate, requireRole('administrator')];

  app.get<{ Querystring: PaginationQuery }>(
    '/volunteer/opportunities',
    { preValidation: volunteerOnly, schema: listOpportunitiesSchema },
    controller.listOpportunities,
  );
  app.post<{ Body: CreateApplicationBody }>(
    '/campaign-applications',
    { preValidation: volunteerOnly, schema: applySchema },
    controller.apply,
  );
  app.get<{ Querystring: ListApplicationsQuery }>(
    '/campaign-applications',
    { preValidation: adminOnly, schema: listApplicationsSchema },
    controller.listApplications,
  );
  app.get<{ Querystring: MyApplicationsQuery }>(
    '/campaign-applications/me',
    { preValidation: volunteerOnly, schema: listMyApplicationsSchema },
    controller.listMyApplications,
  );
  app.patch<{ Params: VolunteerIdParams; Body: ReviewApplicationBody }>(
    '/admin/campaign-applications/:id',
    { preValidation: adminOnly, schema: reviewApplicationSchema },
    controller.reviewApplication,
  );
  app.get<{ Querystring: MyAssignmentsQuery }>(
    '/volunteer-assignments/me',
    { preValidation: volunteerOnly, schema: listMyAssignmentsSchema },
    controller.listMyAssignments,
  );
  app.post<{ Body: CreateHoursBody }>(
    '/volunteer-hours',
    { preValidation: volunteerOnly, schema: recordHoursSchema },
    controller.recordHours,
  );
  app.get<{ Querystring: ListHoursQuery }>(
    '/volunteer-hours',
    { preValidation: adminOnly, schema: listHoursSchema },
    controller.listHours,
  );
  app.get<{ Querystring: PaginationQuery }>(
    '/volunteer-hours/me',
    { preValidation: volunteerOnly, schema: listMyHoursSchema },
    controller.listMyHours,
  );
}
