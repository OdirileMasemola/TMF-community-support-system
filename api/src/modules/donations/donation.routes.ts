import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { createDonationController } from './donation.controller.js';
import {
  createDonationSchema,
  createProofSchema,
  listDonationsSchema,
  listMyDonationsSchema,
  listProofsSchema,
  reviewProofSchema,
} from './donation.schema.js';
import { createDonationService } from './donation.service.js';
import type {
  CreateDonationBody,
  CreateProofBody,
  DonationIdParams,
  ListDonationsQuery,
  ListMyDonationsQuery,
  ListProofsQuery,
  ReviewProofBody,
} from './donation.types.js';

/**
 * Donation routes, registered at /api/v1 (they span /donations and /admin/donation-proofs).
 * Route -> Controller -> Service -> user-scoped Supabase client (RLS applies).
 *
 * Donor endpoints need the donor role; RLS: "Donors create own donations", "Donors and admins view
 * donations", "Donors create own donation proofs". Admin endpoints need the administrator role;
 * RLS: "Admins manage donation proofs", "Admins update donations".
 */
export async function donationRoutes(app: FastifyInstance): Promise<void> {
  const controller = createDonationController(createDonationService({ createUserClient: app.createUserClient }));
  const donorOnly = [authenticate, requireRole('donor')];
  const adminOnly = [authenticate, requireRole('administrator')];

  app.post<{ Body: CreateDonationBody }>(
    '/donations',
    { preValidation: donorOnly, schema: createDonationSchema },
    controller.create,
  );
  app.get<{ Querystring: ListDonationsQuery }>(
    '/donations',
    { preValidation: adminOnly, schema: listDonationsSchema },
    controller.list,
  );
  app.get<{ Querystring: ListMyDonationsQuery }>(
    '/donations/me',
    { preValidation: donorOnly, schema: listMyDonationsSchema },
    controller.listMine,
  );
  app.post<{ Params: DonationIdParams; Body: CreateProofBody }>(
    '/donations/:id/proofs',
    { preValidation: donorOnly, schema: createProofSchema },
    controller.addProof,
  );
  app.get<{ Querystring: ListProofsQuery }>(
    '/admin/donation-proofs',
    { preValidation: adminOnly, schema: listProofsSchema },
    controller.listProofs,
  );
  app.patch<{ Params: DonationIdParams; Body: ReviewProofBody }>(
    '/admin/donation-proofs/:id',
    { preValidation: adminOnly, schema: reviewProofSchema },
    controller.reviewProof,
  );
}
