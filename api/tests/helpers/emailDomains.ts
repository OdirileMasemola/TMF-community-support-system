import type { MailDnsResolver } from '../../src/modules/emailDomains/dnsValidator.js';
import type { DomainInsert, DomainPatch, EmailDomainStore } from '../../src/modules/emailDomains/emailDomain.store.js';
import type {
  EmailDomainAuditRow,
  EmailDomainPolicyRow,
  EmailDomainRow,
  PolicyRejection,
  RegistrationMode,
} from '../../src/modules/emailDomains/emailDomain.types.js';
import { NOW } from './schema.js';

/*
 * Test doubles for the email domain feature. No network: DNS answers come from a table, and the
 * store keeps rows in memory. The policy decision mirrors public.email_domain_registration_check()
 * (covered against real PostgreSQL in supabase/tests/email_domain_management_test.sql).
 */

function dnsError(code: string): Error & { code: string } {
  return Object.assign(new Error(`${code} lookup failed`), { code });
}

export type DnsAnswer =
  | { mx?: Array<{ exchange: string; priority: number }>; a?: string[]; aaaa?: string[] }
  | 'nxdomain'
  | 'timeout'
  | 'servfail'
  | 'hang';

/** Domains not listed answer NXDOMAIN. */
export class MockDnsResolver implements MailDnsResolver {
  calls: Array<{ type: 'MX' | 'A' | 'AAAA'; host: string }> = [];
  cancelled = 0;

  constructor(public answers: Record<string, DnsAnswer> = {}) {}

  private async answer<T>(type: 'MX' | 'A' | 'AAAA', host: string, pick: (records: Exclude<DnsAnswer, string>) => T[] | undefined): Promise<T[]> {
    this.calls.push({ type, host });
    const answer = this.answers[host] ?? 'nxdomain';
    if (answer === 'hang') return new Promise<T[]>(() => undefined);
    if (answer === 'nxdomain') throw dnsError('ENOTFOUND');
    if (answer === 'timeout') throw dnsError('ETIMEOUT');
    if (answer === 'servfail') throw dnsError('ESERVFAIL');
    const records = pick(answer);
    if (records === undefined || records.length === 0) throw dnsError('ENODATA');
    return records;
  }

  resolveMx(host: string) {
    return this.answer('MX', host, (r) => r.mx);
  }

  resolve4(host: string) {
    return this.answer('A', host, (r) => r.a);
  }

  resolve6(host: string) {
    return this.answer('AAAA', host, (r) => r.aaaa);
  }

  cancel(): void {
    this.cancelled += 1;
  }
}

/** Typical answers: real providers and custom domains are all just "domains with MX". */
export function standardDnsAnswers(): Record<string, DnsAnswer> {
  return {
    'gmail.com': { mx: [{ exchange: 'gmail-smtp-in.l.google.com', priority: 5 }] },
    'outlook.com': { mx: [{ exchange: 'outlook-com.olc.protection.outlook.com', priority: 5 }] },
    'company.co.za': { mx: [{ exchange: 'mail.company.co.za', priority: 10 }] },
    'foundation.org': { mx: [{ exchange: 'aspmx.l.google.com', priority: 1 }] },
    'blocked.example': { mx: [{ exchange: 'mx.blocked.example', priority: 10 }] },
    'a-only.example': { a: ['192.0.2.10'] },
    'aaaa-only.example': { aaaa: ['2001:db8::10'] },
    'no-mail.example': {},
    'null-mx.example': { mx: [{ exchange: '', priority: 0 }], a: ['192.0.2.20'] },
    'xn--bcher-kva.example': { mx: [{ exchange: 'mx.xn--bcher-kva.example', priority: 10 }] },
    'slow.example': 'hang',
    'broken.example': 'servfail',
  };
}

/** In-memory EmailDomainStore. Records which operations ran and with which token. */
export class InMemoryEmailDomainStore implements EmailDomainStore {
  domains: EmailDomainRow[] = [];
  audit: EmailDomainAuditRow[] = [];
  policy: EmailDomainPolicyRow = { registration_mode: 'open', updated_at: NOW, updated_by: null };
  calls: Array<{ op: string; token: string | null }> = [];
  /** Makes the next policy check fail like a PostgREST outage. */
  failPolicyCheck = false;
  private counter = 0;

  constructor(private readonly actorForToken: (token: string) => string | null = () => null) {}

  private log(op: string, token: string | null): void {
    this.calls.push({ op, token });
  }

  private record(entity: 'domain' | 'policy', action: 'insert' | 'update' | 'delete', token: string, domain: string | null, before: unknown, after: unknown): void {
    this.audit.unshift({
      id: this.audit.length + 1,
      entity,
      action,
      domain,
      old_values: (before ?? null) as Record<string, unknown> | null,
      new_values: (after ?? null) as Record<string, unknown> | null,
      actor_id: this.actorForToken(token),
      created_at: NOW,
    });
  }

  seed(row: Partial<EmailDomainRow> & Pick<EmailDomainRow, 'domain' | 'policy_type'>): EmailDomainRow {
    this.counter += 1;
    const full: EmailDomainRow = {
      id: `ed000000-0000-4000-8000-${this.counter.toString().padStart(12, '0')}`,
      status: 'active',
      notes: null,
      dns_status: 'valid',
      dns_checked_at: NOW,
      created_at: NOW,
      updated_at: NOW,
      created_by: null,
      updated_by: null,
      ...row,
    };
    this.domains.push(full);
    return full;
  }

  async checkRegistration(domain: string): Promise<PolicyRejection | null> {
    this.log('checkRegistration', null);
    if (this.failPolicyCheck) {
      this.failPolicyCheck = false;
      throw Object.assign(new Error('policy unavailable'), { statusCode: 503 });
    }
    const rule = this.domains
      .filter((d) => d.status === 'active' && (domain === d.domain || domain.endsWith(`.${d.domain}`)))
      .sort((a, b) => b.domain.length - a.domain.length)[0];
    if (rule?.policy_type === 'blocked') return 'blocked';
    if (this.policy.registration_mode === 'restricted' && rule?.policy_type !== 'approved') return 'not_approved';
    return null;
  }

  async listDomains(token: string, filters: { policyType?: string; status?: string; search?: string }) {
    this.log('listDomains', token);
    return this.domains
      .filter((d) => (filters.policyType === undefined || d.policy_type === filters.policyType) && (filters.status === undefined || d.status === filters.status))
      .filter((d) => filters.search === undefined || d.domain.includes(filters.search))
      .sort((a, b) => a.domain.localeCompare(b.domain));
  }

  async getDomain(token: string, id: string) {
    this.log('getDomain', token);
    return this.domains.find((d) => d.id === id) ?? null;
  }

  async insertDomain(token: string, values: DomainInsert) {
    this.log('insertDomain', token);
    if (this.domains.some((d) => d.domain === values.domain)) {
      const { conflictError } = await import('../../src/shared/supabase/errors.js');
      throw conflictError('That domain is already in the list');
    }
    const actor = this.actorForToken(token);
    const row = this.seed({ ...values, created_by: actor, updated_by: actor });
    this.record('domain', 'insert', token, row.domain, null, row);
    return row;
  }

  async updateDomain(token: string, id: string, patch: DomainPatch) {
    this.log('updateDomain', token);
    const row = this.domains.find((d) => d.id === id);
    if (row === undefined) return null;
    const before = { ...row };
    Object.assign(row, patch, { updated_by: this.actorForToken(token), updated_at: '2026-10-08T11:00:00.000000+00:00' });
    this.record('domain', 'update', token, row.domain, before, row);
    return row;
  }

  async deleteDomain(token: string, id: string) {
    this.log('deleteDomain', token);
    const index = this.domains.findIndex((d) => d.id === id);
    if (index === -1) return false;
    const [removed] = this.domains.splice(index, 1);
    this.record('domain', 'delete', token, removed?.domain ?? null, removed, null);
    return true;
  }

  async getPolicy(token: string) {
    this.log('getPolicy', token);
    return { ...this.policy };
  }

  async updatePolicy(token: string, mode: RegistrationMode) {
    this.log('updatePolicy', token);
    const before = { ...this.policy };
    this.policy = { registration_mode: mode, updated_at: '2026-10-08T11:00:00.000000+00:00', updated_by: this.actorForToken(token) };
    this.record('policy', 'update', token, null, before, this.policy);
    return { ...this.policy };
  }

  async listAudit(token: string, limit: number) {
    this.log('listAudit', token);
    return this.audit.slice(0, limit);
  }
}
