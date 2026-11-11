import type { FastifyInstance, FastifyRequest } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { caller } from '../../shared/utils/caller.js';
import { successResponse } from '../../shared/utils/response.js';
import { createDomainMailValidator, type DomainMailValidator } from './dnsValidator.js';
import {
  AUDIT_DEFAULT_LIMIT,
  createDomainSchema,
  deleteDomainSchema,
  emailCheckSchema,
  getPolicySchema,
  listAuditSchema,
  listDomainsSchema,
  recheckDomainSchema,
  updateDomainSchema,
  updatePolicySchema,
  verificationStatusSchema,
} from './emailDomain.schema.js';
import { createEmailDomainService } from './emailDomain.service.js';
import { createSupabaseEmailDomainStore, type EmailDomainStore } from './emailDomain.store.js';
import type {
  CreateEmailDomainBody,
  EmailCheckBody,
  EmailDomainIdParams,
  ListEmailDomainsQuery,
  UpdateEmailDomainBody,
  UpdatePolicyBody,
} from './emailDomain.types.js';

export interface EmailDomainRouteOptions {
  /** Tests inject an in-memory store and a mocked DNS validator. */
  store?: EmailDomainStore;
  dns?: DomainMailValidator;
}

/**
 * Registration email check and email domain administration, registered at the v1 root because it
 * spans /auth/... and /admin/....
 *   POST   /auth/registration/email-check     public, stricter rate limit
 *   GET    /auth/verification-status          signed in
 *   GET    /admin/email-domains               administrator
 *   POST   /admin/email-domains               administrator
 *   PATCH  /admin/email-domains/:id           administrator
 *   POST   /admin/email-domains/:id/dns-check administrator
 *   DELETE /admin/email-domains/:id           administrator
 *   GET    /admin/email-domain-policy         administrator
 *   PUT    /admin/email-domain-policy         administrator
 *   GET    /admin/email-domain-audit          administrator
 * Admin routes need the administrator role from public.profiles (never from the request), and the
 * database RLS policies allow the writes only for public.is_admin().
 */
export async function emailDomainRoutes(app: FastifyInstance, options: EmailDomainRouteOptions = {}): Promise<void> {
  const config = app.appConfig;
  const store = options.store ?? createSupabaseEmailDomainStore({ supabase: app.supabase, createUserClient: app.createUserClient });
  const dns =
    options.dns ??
    createDomainMailValidator({
      timeoutMs: config.emailDnsTimeoutMs,
      positiveTtlMs: config.emailDnsCacheTtlSeconds * 1000,
      negativeTtlMs: Math.max(60, Math.floor(config.emailDnsCacheTtlSeconds / 6)) * 1000,
    });
  const service = createEmailDomainService({ store, dns, attestationSecret: config.emailSignupAttestationSecret });
  const adminOnly = [authenticate, requireRole('administrator')];

  app.post<{ Body: EmailCheckBody }>(
    '/auth/registration/email-check',
    {
      schema: emailCheckSchema,
      config: { rateLimit: { max: config.emailCheckRateLimitMax, timeWindow: '1 minute' } },
    },
    async (request) => successResponse(await service.checkRegistrationEmail(request.body.email, request.log)),
  );

  app.get('/auth/verification-status', { preValidation: [authenticate], schema: verificationStatusSchema }, async (request) => {
    const { accessToken } = caller(request);
    // Re-read from Supabase Auth so the answer reflects email_confirmed_at right now.
    const verified = await app.authProvider.getUser(accessToken);
    if (verified === null) throw ApiError.unauthorized('Invalid or expired access token');
    const confirmedAt = verified.emailConfirmedAt ?? null;
    return successResponse({ email: verified.email ?? null, emailVerified: confirmedAt !== null, emailConfirmedAt: confirmedAt });
  });

  const token = (request: FastifyRequest) => caller(request).accessToken;

  app.get<{ Querystring: ListEmailDomainsQuery }>(
    '/admin/email-domains',
    { preValidation: adminOnly, schema: listDomainsSchema },
    async (request) => successResponse(await service.listDomains(token(request), request.query)),
  );

  app.post<{ Body: CreateEmailDomainBody }>(
    '/admin/email-domains',
    { preValidation: adminOnly, schema: createDomainSchema },
    async (request, reply) => {
      const created = await service.addDomain(token(request), request.body);
      return reply.status(201).send(successResponse(created));
    },
  );

  app.patch<{ Params: EmailDomainIdParams; Body: UpdateEmailDomainBody }>(
    '/admin/email-domains/:id',
    { preValidation: adminOnly, schema: updateDomainSchema },
    async (request) => successResponse(await service.updateDomain(token(request), request.params.id, request.body)),
  );

  app.post<{ Params: EmailDomainIdParams }>(
    '/admin/email-domains/:id/dns-check',
    { preValidation: adminOnly, schema: recheckDomainSchema },
    async (request) => successResponse(await service.recheckDomain(token(request), request.params.id)),
  );

  app.delete<{ Params: EmailDomainIdParams }>(
    '/admin/email-domains/:id',
    { preValidation: adminOnly, schema: deleteDomainSchema },
    async (request) => {
      await service.removeDomain(token(request), request.params.id);
      return successResponse({ id: request.params.id, deleted: true });
    },
  );

  app.get('/admin/email-domain-policy', { preValidation: adminOnly, schema: getPolicySchema }, async (request) =>
    successResponse(await service.getPolicy(token(request))),
  );

  app.put<{ Body: UpdatePolicyBody }>(
    '/admin/email-domain-policy',
    { preValidation: adminOnly, schema: updatePolicySchema },
    async (request) => successResponse(await service.setPolicy(token(request), request.body.registration_mode)),
  );

  app.get<{ Querystring: { limit?: number } }>(
    '/admin/email-domain-audit',
    { preValidation: adminOnly, schema: listAuditSchema },
    async (request) => successResponse(await service.listAudit(token(request), request.query.limit ?? AUDIT_DEFAULT_LIMIT)),
  );
}
