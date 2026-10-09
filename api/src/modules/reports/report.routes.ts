import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { createReportController } from './report.controller.js';
import { createReportSchema, listReportsSchema } from './report.schema.js';
import { createReportService } from './report.service.js';
import type { CreateReportBody, ListReportsQuery } from './report.types.js';

/** Report routes, registered under /api/v1/reports. Every route needs the administrator role. */
export async function reportRoutes(app: FastifyInstance): Promise<void> {
  const controller = createReportController(createReportService({ createUserClient: app.createUserClient }));
  const adminOnly = [authenticate, requireRole('administrator')];

  app.get<{ Querystring: ListReportsQuery }>('/', { preValidation: adminOnly, schema: listReportsSchema }, controller.list);
  app.post<{ Body: CreateReportBody }>('/', { preValidation: adminOnly, schema: createReportSchema }, controller.create);
}
