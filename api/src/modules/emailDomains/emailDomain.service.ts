import { ApiError } from '../../shared/errors/ApiError.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';
import { conflictError, validationError } from '../../shared/supabase/errors.js';
import { createAttestation } from './attestation.js';
import type { DomainMailValidator } from './dnsValidator.js';
import { normaliseDomain, normaliseEmail } from './emailAddress.js';
import type { DomainPatch, EmailDomainStore } from './emailDomain.store.js';
import type {
  CreateEmailDomainBody,
  DnsStatus,
  EmailCheckResult,
  EmailDomainAuditRow,
  EmailDomainPolicyRow,
  EmailDomainRow,
  ListEmailDomainsQuery,
  RegistrationMode,
  UpdateEmailDomainBody,
} from './emailDomain.types.js';

/*
 * The one registration policy service. Every registration path (web, mobile, any other client)
 * calls checkRegistrationEmail before Supabase signUp; the Supabase Auth hook enforces the same
 * format and policy rules (and, with the attestation secret, this DNS check) for anything that
 * skips the API. Messages are the user-facing copy; DNS and database details stay server-side.
 */

export const REGISTRATION_MESSAGES = {
  invalidEmail: 'Please enter a valid email address.',
  undeliverable: 'This email domain is not configured to receive email.',
  restricted: 'Registration using this email domain is currently restricted.',
  dnsUnavailable: 'We could not check this email domain right now. Please try again in a moment.',
} as const;

export interface EmailDomainServiceDeps {
  store: EmailDomainStore;
  dns: DomainMailValidator;
  attestationSecret: string | null;
  now?: () => number;
}

function toDnsStatus(status: 'valid' | 'invalid' | 'unavailable'): DnsStatus {
  return status === 'unavailable' ? 'error' : status;
}

export interface DomainCheckLogger {
  info(details: Record<string, unknown>, message: string): void;
}

export function createEmailDomainService(deps: EmailDomainServiceDeps) {
  const now = deps.now ?? Date.now;

  async function dnsCheck(domain: string): Promise<{ dns_status: DnsStatus; dns_checked_at: string }> {
    const result = await deps.dns.check(domain);
    return { dns_status: toDnsStatus(result.status), dns_checked_at: new Date(now()).toISOString() };
  }

  return {
    /**
     * format -> DNS (MX, else A/AAAA) -> policy (blocked / restricted). Throws a 4xx/5xx ApiError
     * with user-facing copy on rejection. Never creates an account.
     */
    async checkRegistrationEmail(rawEmail: unknown, log?: DomainCheckLogger): Promise<EmailCheckResult> {
      const address = normaliseEmail(rawEmail);
      if (!address.ok) {
        throw new ApiError(422, ErrorCodes.INVALID_EMAIL, REGISTRATION_MESSAGES.invalidEmail);
      }

      const dns = await deps.dns.check(address.domain);
      // Only the domain is logged, never the address.
      log?.info({ domain: address.domain, dns: dns.status, method: dns.method, reason: dns.reason, cached: dns.cached }, 'email domain DNS check');
      if (dns.status === 'unavailable') {
        throw new ApiError(503, ErrorCodes.EMAIL_DOMAIN_CHECK_UNAVAILABLE, REGISTRATION_MESSAGES.dnsUnavailable);
      }
      if (dns.status === 'invalid') {
        throw new ApiError(422, ErrorCodes.EMAIL_DOMAIN_UNDELIVERABLE, REGISTRATION_MESSAGES.undeliverable);
      }

      const rejection = await deps.store.checkRegistration(address.domain);
      if (rejection === 'invalid') {
        throw new ApiError(422, ErrorCodes.INVALID_EMAIL, REGISTRATION_MESSAGES.invalidEmail);
      }
      if (rejection !== null) {
        throw new ApiError(422, ErrorCodes.EMAIL_DOMAIN_RESTRICTED, REGISTRATION_MESSAGES.restricted);
      }

      const attestation = deps.attestationSecret === null ? null : createAttestation(deps.attestationSecret, address.email, now());
      return {
        email: address.email,
        domain: address.domain,
        attestation: attestation?.token ?? null,
        attestationExpiresAt: attestation?.expiresAt.toISOString() ?? null,
      };
    },

    async listDomains(accessToken: string, query: ListEmailDomainsQuery): Promise<EmailDomainRow[]> {
      const search = query.search?.trim().toLowerCase();
      return deps.store.listDomains(accessToken, {
        policyType: query.policy_type,
        status: query.status,
        ...(search ? { search } : {}),
      });
    },

    async addDomain(accessToken: string, body: CreateEmailDomainBody): Promise<EmailDomainRow> {
      const domain = normaliseDomain(body.domain);
      if (domain === null) throw validationError('Enter a valid domain, for example company.co.za');
      const existing = await deps.store.listDomains(accessToken, { search: domain });
      if (existing.some((row) => row.domain === domain)) throw conflictError('That domain is already in the list');

      return deps.store.insertDomain(accessToken, {
        domain,
        policy_type: body.policy_type,
        status: body.status ?? 'active',
        notes: body.notes?.trim() || null,
        ...(await dnsCheck(domain)),
      });
    },

    async updateDomain(accessToken: string, id: string, body: UpdateEmailDomainBody): Promise<EmailDomainRow> {
      const patch: DomainPatch = {};
      if (body.policy_type !== undefined) patch.policy_type = body.policy_type;
      if (body.status !== undefined) patch.status = body.status;
      if (body.notes !== undefined) patch.notes = body.notes?.trim() || null;
      // Unknown fields (e.g. domain, created_by) are stripped by the schema; nothing left = nothing allowed.
      if (Object.keys(patch).length === 0) throw validationError('Only the policy type, status and notes can be changed');
      const updated = await deps.store.updateDomain(accessToken, id, patch);
      if (updated === null) throw ApiError.notFound('Email domain not found');
      return updated;
    },

    async recheckDomain(accessToken: string, id: string): Promise<EmailDomainRow> {
      const current = await deps.store.getDomain(accessToken, id);
      if (current === null) throw ApiError.notFound('Email domain not found');
      deps.dns.forget(current.domain);
      const updated = await deps.store.updateDomain(accessToken, id, await dnsCheck(current.domain));
      if (updated === null) throw ApiError.notFound('Email domain not found');
      return updated;
    },

    async removeDomain(accessToken: string, id: string): Promise<void> {
      const removed = await deps.store.deleteDomain(accessToken, id);
      if (!removed) throw ApiError.notFound('Email domain not found');
    },

    async getPolicy(accessToken: string): Promise<EmailDomainPolicyRow> {
      const policy = await deps.store.getPolicy(accessToken);
      // RLS hides the row from non-administrators; the route already requires the role.
      if (policy === null) throw ApiError.notFound('Registration policy not found');
      return policy;
    },

    async setPolicy(accessToken: string, mode: RegistrationMode): Promise<EmailDomainPolicyRow> {
      const policy = await deps.store.updatePolicy(accessToken, mode);
      if (policy === null) throw ApiError.notFound('Registration policy not found');
      return policy;
    },

    async listAudit(accessToken: string, limit: number): Promise<EmailDomainAuditRow[]> {
      return deps.store.listAudit(accessToken, limit);
    },
  };
}

export type EmailDomainService = ReturnType<typeof createEmailDomainService>;
