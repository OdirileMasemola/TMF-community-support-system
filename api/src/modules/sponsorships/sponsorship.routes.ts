import type { FastifyInstance, FastifyRequest } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { createSponsorshipController } from './sponsorship.controller.js';
import {
  createRequestSchema,
  createResponseSchema,
  createSponsorshipSchema,
  listMyResponsesSchema,
  listMySponsorshipsSchema,
  listRequestsSchema,
  listSponsorshipsSchema,
  updateRequestSchema,
  updateSponsorshipSchema,
} from './sponsorship.schema.js';
import { createSponsorshipService } from './sponsorship.service.js';
import type {
  CreateResponseBody,
  CreateSponsorshipBody,
  CreateSponsorshipRequestBody,
  ListRequestsQuery,
  ListSponsorshipsQuery,
  PageQuery,
  SponsorshipIdParams,
  UpdateSponsorshipBody,
  UpdateSponsorshipRequestBody,
} from './sponsorship.types.js';

/**
 * Sponsorship routes, registered at /api/v1 (they span /sponsorships and /sponsorship-requests).
 * Route -> Controller -> Service -> user-scoped Supabase client (RLS applies).
 *
 * Sponsor endpoints need the sponsor role, GET /sponsorships the administrator role, and
 * GET /sponsorship-requests either of them.
 */
/** The response body is optional: a POST without a body is treated as `{}` (runs before validation). */
async function emptyBodyAsObject(request: FastifyRequest): Promise<void> {
  if (request.body === undefined || request.body === null) request.body = {};
}

export async function sponsorshipRoutes(app: FastifyInstance): Promise<void> {
  const controller = createSponsorshipController(createSponsorshipService({ createUserClient: app.createUserClient }));
  const sponsorOnly = [authenticate, requireRole('sponsor')];
  const adminOnly = [authenticate, requireRole('administrator')];
  const sponsorOrAdmin = [authenticate, requireRole('sponsor', 'administrator')];

  app.post<{ Body: CreateSponsorshipBody }>(
    '/sponsorships',
    { preValidation: sponsorOnly, schema: createSponsorshipSchema },
    controller.create,
  );
  app.get<{ Querystring: ListSponsorshipsQuery }>(
    '/sponsorships',
    { preValidation: adminOnly, schema: listSponsorshipsSchema },
    controller.list,
  );
  app.get<{ Querystring: ListSponsorshipsQuery }>(
    '/sponsorships/me',
    { preValidation: sponsorOnly, schema: listMySponsorshipsSchema },
    controller.listMine,
  );
  app.patch<{ Params: SponsorshipIdParams; Body: UpdateSponsorshipBody }>(
    '/sponsorships/:id',
    { preValidation: adminOnly, schema: updateSponsorshipSchema },
    controller.update,
  );
  app.get<{ Querystring: ListRequestsQuery }>(
    '/sponsorship-requests',
    { preValidation: sponsorOrAdmin, schema: listRequestsSchema },
    controller.listRequests,
  );
  app.post<{ Body: CreateSponsorshipRequestBody }>(
    '/sponsorship-requests',
    { preValidation: adminOnly, schema: createRequestSchema },
    controller.createRequest,
  );
  app.patch<{ Params: SponsorshipIdParams; Body: UpdateSponsorshipRequestBody }>(
    '/sponsorship-requests/:id',
    { preValidation: adminOnly, schema: updateRequestSchema },
    controller.updateRequest,
  );
  app.get<{ Querystring: PageQuery }>(
    '/sponsorship-request-responses/me',
    { preValidation: sponsorOnly, schema: listMyResponsesSchema },
    controller.listMyResponses,
  );
  app.post<{ Params: SponsorshipIdParams; Body: CreateResponseBody }>(
    '/sponsorship-requests/:id/responses',
    { preValidation: [...sponsorOnly, emptyBodyAsObject], schema: createResponseSchema },
    controller.respond,
  );
}
