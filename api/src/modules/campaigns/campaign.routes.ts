import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { createCampaignController } from './campaign.controller.js';
import {
  archiveCampaignSchema,
  createCampaignSchema,
  getCampaignSchema,
  listCampaignsSchema,
  updateCampaignSchema,
} from './campaign.schema.js';
import { createCampaignService } from './campaign.service.js';
import type {
  CampaignIdParams,
  CreateCampaignBody,
  ListCampaignsQuery,
  UpdateCampaignBody,
} from './campaign.types.js';

/**
 * Campaign routes, registered under /api/v1/campaigns.
 * Route -> Controller -> Service -> user-scoped Supabase client (RLS applies).
 *
 * Auth runs in preValidation (before schema validation), so anonymous callers get 401 and
 * non-administrators get 403 before their input is validated.
 *
 * Reads require a signed-in, non-suspended account: anon has no SELECT grant on public.campaigns,
 * so the API keeps that behaviour. Writes are administrator-only (requireRole), and RLS
 * ("Admins manage campaigns") enforces the same rule again in the database.
 */
export async function campaignRoutes(app: FastifyInstance): Promise<void> {
  const controller = createCampaignController(createCampaignService({ createUserClient: app.createUserClient }));
  const adminOnly = [authenticate, requireRole('administrator')];

  app.get<{ Querystring: ListCampaignsQuery }>(
    '/',
    { preValidation: [authenticate], schema: listCampaignsSchema },
    controller.list,
  );
  app.get<{ Params: CampaignIdParams }>(
    '/:id',
    { preValidation: [authenticate], schema: getCampaignSchema },
    controller.getById,
  );
  app.post<{ Body: CreateCampaignBody }>('/', { preValidation: adminOnly, schema: createCampaignSchema }, controller.create);
  app.patch<{ Params: CampaignIdParams; Body: UpdateCampaignBody }>(
    '/:id',
    { preValidation: adminOnly, schema: updateCampaignSchema },
    controller.update,
  );
  app.delete<{ Params: CampaignIdParams }>(
    '/:id',
    { preValidation: adminOnly, schema: archiveCampaignSchema },
    controller.archive,
  );
}
