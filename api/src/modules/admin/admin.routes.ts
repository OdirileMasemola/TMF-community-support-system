import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { createAdminController } from './admin.controller.js';
import { getDashboardSchema, listUsersSchema, updateUserStatusSchema } from './admin.schema.js';
import { createAdminService } from './admin.service.js';
import type { ListUsersQuery, UpdateUserStatusBody, UserIdParams } from './admin.types.js';

/**
 * Administration routes, mounted at /api/v1/admin. Every route needs the administrator role.
 * Route -> Controller -> Service -> user-scoped Supabase client (RLS applies).
 */
export async function adminRoutes(app: FastifyInstance): Promise<void> {
  const controller = createAdminController(createAdminService({ createUserClient: app.createUserClient }));
  const adminOnly = [authenticate, requireRole('administrator')];

  app.get('/dashboard', { preValidation: adminOnly, schema: getDashboardSchema }, controller.dashboard);
  app.get<{ Querystring: ListUsersQuery }>('/users', { preValidation: adminOnly, schema: listUsersSchema }, controller.listUsers);
  app.patch<{ Params: UserIdParams; Body: UpdateUserStatusBody }>(
    '/users/:id/status',
    { preValidation: adminOnly, schema: updateUserStatusSchema },
    controller.updateUserStatus,
  );
}
