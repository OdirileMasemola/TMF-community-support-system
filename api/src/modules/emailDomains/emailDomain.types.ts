/** Email domain management types. Values match the CHECK constraints in the migration. */

export const REGISTRATION_MODES = ['open', 'restricted'] as const;
export type RegistrationMode = (typeof REGISTRATION_MODES)[number];

export const DOMAIN_POLICY_TYPES = ['approved', 'blocked'] as const;
export type DomainPolicyType = (typeof DOMAIN_POLICY_TYPES)[number];

export const DOMAIN_STATUSES = ['active', 'inactive'] as const;
export type DomainStatus = (typeof DOMAIN_STATUSES)[number];

export const DNS_STATUSES = ['unchecked', 'valid', 'invalid', 'error'] as const;
export type DnsStatus = (typeof DNS_STATUSES)[number];

/** Result of public.email_domain_registration_check(): null = allowed. */
export type PolicyRejection = 'invalid' | 'blocked' | 'not_approved';

export const NOTES_MAX_LENGTH = 500;

/** A public.email_domain_settings row (snake_case, as stored). */
export interface EmailDomainRow {
  id: string;
  domain: string;
  policy_type: DomainPolicyType;
  status: DomainStatus;
  notes: string | null;
  dns_status: DnsStatus;
  dns_checked_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export const EMAIL_DOMAIN_COLUMNS =
  'id, domain, policy_type, status, notes, dns_status, dns_checked_at, created_at, updated_at, created_by, updated_by';

export interface EmailDomainPolicyRow {
  registration_mode: RegistrationMode;
  updated_at: string;
  updated_by: string | null;
}

export const EMAIL_DOMAIN_POLICY_COLUMNS = 'registration_mode, updated_at, updated_by';

export interface EmailDomainAuditRow {
  id: number;
  entity: 'domain' | 'policy';
  action: 'insert' | 'update' | 'delete';
  domain: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  actor_id: string | null;
  created_at: string;
}

export const EMAIL_DOMAIN_AUDIT_COLUMNS = 'id, entity, action, domain, old_values, new_values, actor_id, created_at';

export interface CreateEmailDomainBody {
  domain: string;
  policy_type: DomainPolicyType;
  status?: DomainStatus;
  notes?: string | null;
}

export interface UpdateEmailDomainBody {
  policy_type?: DomainPolicyType;
  status?: DomainStatus;
  notes?: string | null;
}

export interface UpdatePolicyBody {
  registration_mode: RegistrationMode;
}

export interface ListEmailDomainsQuery {
  policy_type?: DomainPolicyType;
  status?: DomainStatus;
  search?: string;
}

export interface EmailDomainIdParams {
  id: string;
}

export interface EmailCheckBody {
  email: string;
}

/** Response of POST /auth/registration/email-check. */
export interface EmailCheckResult {
  /** Normalised address to pass to Supabase signUp. */
  email: string;
  domain: string;
  /** Signed proof of this check for the Auth hook; null when the API has no attestation secret. */
  attestation: string | null;
  attestationExpiresAt: string | null;
}
