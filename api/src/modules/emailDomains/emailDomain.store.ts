import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';
import { conflictError, toApiError } from '../../shared/supabase/errors.js';
import {
  EMAIL_DOMAIN_AUDIT_COLUMNS,
  EMAIL_DOMAIN_COLUMNS,
  EMAIL_DOMAIN_POLICY_COLUMNS,
  type DnsStatus,
  type DomainPolicyType,
  type DomainStatus,
  type EmailDomainAuditRow,
  type EmailDomainPolicyRow,
  type EmailDomainRow,
  type PolicyRejection,
  type RegistrationMode,
} from './emailDomain.types.js';

/*
 * Data access for email domain management. Two kinds of access, and no service-role key:
 *  - checkRegistration: the public.email_domain_registration_check() RPC with the publishable key
 *    (anon). It only returns the decision for one domain.
 *  - everything else: a client acting as the calling administrator, so the admin-only RLS policies
 *    in 20261112120000_email_domain_management.sql decide. The API's role check is a second layer.
 */

export interface DomainInsert {
  domain: string;
  policy_type: DomainPolicyType;
  status: DomainStatus;
  notes: string | null;
  dns_status: DnsStatus;
  dns_checked_at: string | null;
}

export type DomainPatch = Partial<Pick<DomainInsert, 'policy_type' | 'status' | 'notes' | 'dns_status' | 'dns_checked_at'>>;

export interface DomainFilters {
  policyType?: DomainPolicyType;
  status?: DomainStatus;
  search?: string;
}

export interface EmailDomainStore {
  checkRegistration(domain: string): Promise<PolicyRejection | null>;
  listDomains(accessToken: string, filters: DomainFilters): Promise<EmailDomainRow[]>;
  getDomain(accessToken: string, id: string): Promise<EmailDomainRow | null>;
  insertDomain(accessToken: string, values: DomainInsert): Promise<EmailDomainRow>;
  updateDomain(accessToken: string, id: string, patch: DomainPatch): Promise<EmailDomainRow | null>;
  deleteDomain(accessToken: string, id: string): Promise<boolean>;
  getPolicy(accessToken: string): Promise<EmailDomainPolicyRow | null>;
  updatePolicy(accessToken: string, mode: RegistrationMode): Promise<EmailDomainPolicyRow | null>;
  listAudit(accessToken: string, limit: number): Promise<EmailDomainAuditRow[]>;
}

const POLICY_REJECTIONS = new Set<PolicyRejection>(['invalid', 'blocked', 'not_approved']);

function fail(error: PostgrestError, status: number, action: string, resource: string): never {
  if (error.code === '23505') throw conflictError('That domain is already in the list');
  throw toApiError(error, status, action, resource);
}

export function createSupabaseEmailDomainStore(deps: {
  supabase: SupabaseClient;
  createUserClient: (accessToken: string) => SupabaseClient;
}): EmailDomainStore {
  return {
    async checkRegistration(domain) {
      const { data, error, status } = await deps.supabase.rpc('email_domain_registration_check', { p_domain: domain });
      if (error !== null) {
        // Fail closed: if the policy cannot be read, nobody is told they may register.
        throw new ApiError(503, ErrorCodes.SERVICE_UNAVAILABLE, 'Registration checks are unavailable. Please try again shortly.', {
          cause: { error, status },
        });
      }
      if (data === null) return null;
      if (typeof data === 'string' && POLICY_REJECTIONS.has(data as PolicyRejection)) return data as PolicyRejection;
      throw new ApiError(503, ErrorCodes.SERVICE_UNAVAILABLE, 'Registration checks are unavailable. Please try again shortly.', {
        cause: { unexpected: data },
      });
    },

    async listDomains(accessToken, filters) {
      let query = deps.createUserClient(accessToken).from('email_domain_settings').select(EMAIL_DOMAIN_COLUMNS);
      if (filters.policyType !== undefined) query = query.eq('policy_type', filters.policyType);
      if (filters.status !== undefined) query = query.eq('status', filters.status);
      if (filters.search !== undefined && filters.search !== '') query = query.ilike('domain', `%${filters.search}%`);
      const { data, error, status } = await query.order('domain', { ascending: true });
      if (error !== null) fail(error, status, 'list', 'email domain');
      return (data ?? []) as EmailDomainRow[];
    },

    async getDomain(accessToken, id) {
      const { data, error, status } = await deps
        .createUserClient(accessToken)
        .from('email_domain_settings')
        .select(EMAIL_DOMAIN_COLUMNS)
        .eq('id', id)
        .maybeSingle();
      if (error !== null) fail(error, status, 'load', 'email domain');
      return (data as EmailDomainRow | null) ?? null;
    },

    async insertDomain(accessToken, values) {
      const { data, error, status } = await deps
        .createUserClient(accessToken)
        .from('email_domain_settings')
        .insert(values)
        .select(EMAIL_DOMAIN_COLUMNS)
        .single();
      if (error !== null) fail(error, status, 'add', 'email domain');
      return data as EmailDomainRow;
    },

    async updateDomain(accessToken, id, patch) {
      const { data, error, status } = await deps
        .createUserClient(accessToken)
        .from('email_domain_settings')
        .update(patch)
        .eq('id', id)
        .select(EMAIL_DOMAIN_COLUMNS)
        .maybeSingle();
      if (error !== null) fail(error, status, 'update', 'email domain');
      return (data as EmailDomainRow | null) ?? null;
    },

    async deleteDomain(accessToken, id) {
      const { data, error, status } = await deps
        .createUserClient(accessToken)
        .from('email_domain_settings')
        .delete()
        .eq('id', id)
        .select('id');
      if (error !== null) fail(error, status, 'remove', 'email domain');
      return Array.isArray(data) && data.length > 0;
    },

    async getPolicy(accessToken) {
      const { data, error, status } = await deps
        .createUserClient(accessToken)
        .from('email_domain_policy')
        .select(EMAIL_DOMAIN_POLICY_COLUMNS)
        .eq('id', 1)
        .maybeSingle();
      if (error !== null) fail(error, status, 'load', 'registration policy');
      return (data as EmailDomainPolicyRow | null) ?? null;
    },

    async updatePolicy(accessToken, mode) {
      const { data, error, status } = await deps
        .createUserClient(accessToken)
        .from('email_domain_policy')
        .update({ registration_mode: mode })
        .eq('id', 1)
        .select(EMAIL_DOMAIN_POLICY_COLUMNS)
        .maybeSingle();
      if (error !== null) fail(error, status, 'update', 'registration policy');
      return (data as EmailDomainPolicyRow | null) ?? null;
    },

    async listAudit(accessToken, limit) {
      const { data, error, status } = await deps
        .createUserClient(accessToken)
        .from('email_domain_audit_log')
        .select(EMAIL_DOMAIN_AUDIT_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error !== null) fail(error, status, 'load', 'audit log');
      return (data ?? []) as EmailDomainAuditRow[];
    },
  };
}
