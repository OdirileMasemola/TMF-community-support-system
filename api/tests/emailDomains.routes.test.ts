import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { verifyAttestation } from '../src/modules/emailDomains/attestation.js';
import { createDomainMailValidator } from '../src/modules/emailDomains/dnsValidator.js';
import type { AuthProvider } from '../src/shared/types/auth.types.js';
import { InMemoryEmailDomainStore, MockDnsResolver, standardDnsAnswers } from './helpers/emailDomains.js';
import { FakeSupabase, expectErrorShape } from './helpers/fakeSupabase.js';
import { ACCOUNTS, USERS, auth, baseSeed } from './helpers/fixtures.js';

const V1 = '/api/v1';
const CHECK = `${V1}/auth/registration/email-check`;
const DOMAINS = `${V1}/admin/email-domains`;
const POLICY = `${V1}/admin/email-domain-policy`;
const AUDIT = `${V1}/admin/email-domain-audit`;
const SECRET = 'route-test-attestation-secret-0123456789';
const MISSING = '99999999-9999-4999-8999-999999999999';

const db = new FakeSupabase(ACCOUNTS);
const actorForToken = (token: string) => Object.values(USERS).find((u) => u.token === token)?.id ?? null;

/** Supabase Auth says the sponsor confirmed their address; everyone else has not. */
const authProvider: AuthProvider = {
  getUser: async (token) => {
    const user = await db.authProvider.getUser(token);
    if (user === null) return null;
    return token === USERS.sponsor.token ? { ...user, emailConfirmedAt: '2026-10-08T09:00:00Z' } : user;
  },
  getProfile: (id, token) => db.authProvider.getProfile(id, token),
};

async function build(env: Record<string, string> = {}) {
  const store = new InMemoryEmailDomainStore(actorForToken);
  const resolver = new MockDnsResolver(standardDnsAnswers());
  const dns = createDomainMailValidator({ resolver, timeoutMs: 50 });
  const app = await buildApp(loadConfig({ ...process.env, EMAIL_SIGNUP_ATTESTATION_SECRET: SECRET, EMAIL_CHECK_RATE_LIMIT_MAX: '1000', ...env }), {
    authProvider,
    createUserClient: db.createUserClient,
    emailDomains: { store, dns },
  });
  await app.ready();
  return { app, store, resolver };
}

describe('registration email check', () => {
  let app: FastifyInstance;
  let store: InMemoryEmailDomainStore;
  let resolver: MockDnsResolver;

  beforeAll(async () => {
    ({ app, store, resolver } = await build());
  });
  afterAll(async () => app.close());
  beforeEach(() => {
    db.reset(baseSeed());
    store.domains = [];
    store.calls = [];
    store.policy = { ...store.policy, registration_mode: 'open' };
  });

  const check = (email: unknown, ip = '10.0.0.1') =>
    app.inject({ method: 'POST', url: CHECK, payload: { email }, remoteAddress: ip });

  it.each([
    ['Someone@Gmail.com', 'someone@gmail.com'],
    ['someone@outlook.com', 'someone@outlook.com'],
    [' Thandi@Company.co.za ', 'thandi@company.co.za'],
    ['info@bücher.example', 'info@xn--bcher-kva.example'],
    ['ops@a-only.example', 'ops@a-only.example'],
  ])('accepts %j and returns the normalised address with an attestation', async (input, normalised) => {
    const response = await check(input);
    expect(response.statusCode).toBe(200);
    const { data } = response.json() as { data: { email: string; attestation: string; attestationExpiresAt: string } };
    expect(data.email).toBe(normalised);
    expect(verifyAttestation(SECRET, normalised, data.attestation)).toBe(true);
    expect(new Date(data.attestationExpiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it.each(['', 'plainaddress', 'a@b@c.org', 'no-domain@', '"q"@example.org', 'a@localhost'])('rejects malformed %j with INVALID_EMAIL before any lookup', async (input) => {
    const response = await check(input);
    expectErrorShape(response, 422, 'INVALID_EMAIL');
    expect(response.json().error.message).toBe('Please enter a valid email address.');
    expect(store.calls).toEqual([]);
  });

  it('rejects a missing email with 400', async () => {
    expectErrorShape(await app.inject({ method: 'POST', url: CHECK, payload: {} }), 400, 'VALIDATION_ERROR');
    // Ajv coerces null to an empty string, which the format check then rejects.
    expectErrorShape(await app.inject({ method: 'POST', url: CHECK, payload: { email: null } }), 422, 'INVALID_EMAIL');
  });

  it.each(['someone@does-not-exist.example', 'someone@no-mail.example', 'someone@null-mx.example'])('rejects %s: no mail delivery configuration', async (email) => {
    const response = await check(email);
    expectErrorShape(response, 422, 'EMAIL_DOMAIN_UNDELIVERABLE');
    expect(response.json().error.message).toBe('This email domain is not configured to receive email.');
    expect(response.body).not.toMatch(/nxdomain|null_mx|no_mail_records|MX/i);
  });

  it('returns 503 (retry) when DNS times out or fails, without leaking details', async () => {
    for (const email of ['a@slow.example', 'a@broken.example']) {
      const response = await check(email);
      expectErrorShape(response, 503, 'EMAIL_DOMAIN_CHECK_UNAVAILABLE');
      expect(response.body).not.toMatch(/timeout|servfail|dns_error/i);
    }
  });

  it('open mode: rejects blocked domains (and their subdomains), accepts others', async () => {
    store.seed({ domain: 'blocked.example', policy_type: 'blocked' });
    resolver.answers['mail.blocked.example'] = { mx: [{ exchange: 'mx', priority: 1 }] };
    for (const email of ['x@blocked.example', 'x@mail.blocked.example']) {
      const response = await check(email);
      expectErrorShape(response, 422, 'EMAIL_DOMAIN_RESTRICTED');
      expect(response.json().error.message).toBe('Registration using this email domain is currently restricted.');
    }
    expect((await check('x@gmail.com')).statusCode).toBe(200);
  });

  it('restricted mode: approved domains pass, unapproved and inactive ones do not', async () => {
    store.policy.registration_mode = 'restricted';
    store.seed({ domain: 'foundation.org', policy_type: 'approved' });
    store.seed({ domain: 'company.co.za', policy_type: 'approved', status: 'inactive' });
    expect((await check('staff@foundation.org')).statusCode).toBe(200);
    expectErrorShape(await check('someone@gmail.com'), 422, 'EMAIL_DOMAIN_RESTRICTED');
    expectErrorShape(await check('someone@company.co.za'), 422, 'EMAIL_DOMAIN_RESTRICTED');
  });

  it('restricted mode still requires mail DNS for approved domains', async () => {
    store.policy.registration_mode = 'restricted';
    store.seed({ domain: 'no-mail.example', policy_type: 'approved' });
    expectErrorShape(await check('a@no-mail.example'), 422, 'EMAIL_DOMAIN_UNDELIVERABLE');
  });

  it('a policy change applies to the next registration check', async () => {
    expect((await check('someone@gmail.com')).statusCode).toBe(200);
    const put = await app.inject({ method: 'PUT', url: POLICY, headers: auth('admin'), payload: { registration_mode: 'restricted' } });
    expect(put.statusCode).toBe(200);
    expectErrorShape(await check('someone@gmail.com'), 422, 'EMAIL_DOMAIN_RESTRICTED');
  });

  it('fails closed when the policy cannot be read', async () => {
    store.failPolicyCheck = true;
    const response = await check('someone@gmail.com');
    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  });

  it('never creates an account or calls Supabase Auth', async () => {
    await check('someone@gmail.com');
    expect(db.requests.filter((r) => r.url.pathname.startsWith('/auth/v1'))).toEqual([]);
  });

  it('ignores client-supplied verification, policy or attestation fields', async () => {
    store.seed({ domain: 'blocked.example', policy_type: 'blocked' });
    const response = await app.inject({
      method: 'POST',
      url: CHECK,
      payload: { email: 'a@blocked.example', email_verified: true, policy: 'approved', attestation: 'v1.1.00' },
    });
    expectErrorShape(response, 422, 'EMAIL_DOMAIN_RESTRICTED');
  });
});

describe('registration email check without an attestation secret', () => {
  it('still validates and returns attestation: null', async () => {
    const { app } = await build({ EMAIL_SIGNUP_ATTESTATION_SECRET: '' });
    const response = await app.inject({ method: 'POST', url: CHECK, payload: { email: 'a@gmail.com' } });
    expect(response.json()).toEqual({ data: { email: 'a@gmail.com', domain: 'gmail.com', attestation: null, attestationExpiresAt: null } });
    await app.close();
  });
});

describe('registration email check rate limit', () => {
  it('returns 429 after EMAIL_CHECK_RATE_LIMIT_MAX requests per minute from one client', async () => {
    const { app } = await build({ EMAIL_CHECK_RATE_LIMIT_MAX: '3' });
    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      statuses.push((await app.inject({ method: 'POST', url: CHECK, payload: { email: 'a@gmail.com' }, remoteAddress: '10.9.9.9' })).statusCode);
    }
    expect(statuses).toEqual([200, 200, 200, 429]);
    const other = await app.inject({ method: 'POST', url: CHECK, payload: { email: 'a@gmail.com' }, remoteAddress: '10.9.9.8' });
    expect(other.statusCode).toBe(200);
    await app.close();
  });
});

describe('email verification status', () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    ({ app } = await build());
  });
  afterAll(async () => app.close());
  beforeEach(() => db.reset(baseSeed()));

  it('reports unconfirmed users as not verified', async () => {
    const response = await app.inject({ method: 'GET', url: `${V1}/auth/verification-status`, headers: auth('donor') });
    expect(response.json()).toEqual({ data: { email: USERS.donor.email, emailVerified: false, emailConfirmedAt: null } });
  });

  it('recognises users Supabase has confirmed', async () => {
    const response = await app.inject({ method: 'GET', url: `${V1}/auth/verification-status`, headers: auth('sponsor') });
    expect(response.json()).toEqual({ data: { email: USERS.sponsor.email, emailVerified: true, emailConfirmedAt: '2026-10-08T09:00:00Z' } });
  });

  it('ignores verification claims in headers or query', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `${V1}/auth/verification-status?emailVerified=true&email_verified=true`,
      headers: { ...auth('donor'), 'x-email-verified': 'true' },
    });
    expect(response.json().data.emailVerified).toBe(false);
  });

  it('requires a valid token', async () => {
    expectErrorShape(await app.inject({ method: 'GET', url: `${V1}/auth/verification-status` }), 401, 'UNAUTHORIZED');
  });
});

describe('email domain administration', () => {
  let app: FastifyInstance;
  let store: InMemoryEmailDomainStore;

  beforeAll(async () => {
    ({ app, store } = await build());
  });
  afterAll(async () => app.close());
  beforeEach(() => {
    db.reset(baseSeed());
    store.domains = [];
    store.audit = [];
    store.calls = [];
    store.policy = { ...store.policy, registration_mode: 'open' };
  });

  it('lets an administrator add a domain (normalised, DNS checked, actor from the token)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: DOMAINS,
      headers: auth('admin'),
      payload: { domain: ' Company.CO.za ', policy_type: 'approved', notes: ' Partner ' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().data).toMatchObject({
      domain: 'company.co.za',
      policy_type: 'approved',
      status: 'active',
      notes: 'Partner',
      dns_status: 'valid',
      created_by: USERS.admin.id,
    });
    expect(store.calls.find((c) => c.op === 'insertDomain')?.token).toBe(USERS.admin.token);
  });

  it('records the DNS result for a domain that cannot receive mail', async () => {
    const response = await app.inject({ method: 'POST', url: DOMAINS, headers: auth('admin'), payload: { domain: 'no-mail.example', policy_type: 'blocked' } });
    expect(response.json().data.dns_status).toBe('invalid');
    const slow = await app.inject({ method: 'POST', url: DOMAINS, headers: auth('admin'), payload: { domain: 'slow.example', policy_type: 'approved' } });
    expect(slow.json().data.dns_status).toBe('error');
  });

  it('rejects duplicates, also when written differently', async () => {
    store.seed({ domain: 'foundation.org', policy_type: 'approved' });
    for (const domain of ['foundation.org', 'FOUNDATION.ORG ']) {
      const response = await app.inject({ method: 'POST', url: DOMAINS, headers: auth('admin'), payload: { domain, policy_type: 'blocked' } });
      expectErrorShape(response, 409, 'CONFLICT');
    }
    expect(store.domains).toHaveLength(1);
  });

  it('rejects invalid domains and policy types', async () => {
    for (const payload of [
      { domain: 'not a domain', policy_type: 'approved' },
      { domain: 'x@gmail.com', policy_type: 'approved' },
      { domain: 'gmail.com', policy_type: 'allow' },
      { domain: 'gmail.com' },
    ]) {
      expectErrorShape(await app.inject({ method: 'POST', url: DOMAINS, headers: auth('admin'), payload }), 400, 'VALIDATION_ERROR');
    }
    expect(store.domains).toEqual([]);
  });

  it('never takes audit or DNS fields from the client', async () => {
    const response = await app.inject({
      method: 'POST',
      url: DOMAINS,
      headers: auth('admin'),
      payload: { domain: 'no-mail.example', policy_type: 'approved', created_by: USERS.donor.id, dns_status: 'valid', id: '00000000-0000-4000-8000-000000000000' },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().data).toMatchObject({ created_by: USERS.admin.id, dns_status: 'invalid' });
    expect(response.json().data.id).not.toBe('00000000-0000-4000-8000-000000000000');
  });

  it('lists, filters, updates, re-checks and removes domains', async () => {
    const approved = store.seed({ domain: 'foundation.org', policy_type: 'approved' });
    store.seed({ domain: 'blocked.example', policy_type: 'blocked' });

    const list = await app.inject({ method: 'GET', url: `${DOMAINS}?policy_type=blocked`, headers: auth('admin') });
    expect(list.json().data.map((d: { domain: string }) => d.domain)).toEqual(['blocked.example']);

    const blocked = await app.inject({ method: 'PATCH', url: `${DOMAINS}/${approved.id}`, headers: auth('admin2'), payload: { policy_type: 'blocked', status: 'inactive' } });
    expect(blocked.json().data).toMatchObject({ policy_type: 'blocked', status: 'inactive', updated_by: USERS.admin2.id });

    const renamed = await app.inject({ method: 'PATCH', url: `${DOMAINS}/${approved.id}`, headers: auth('admin'), payload: { domain: 'other.org' } });
    expectErrorShape(renamed, 400, 'VALIDATION_ERROR');

    const recheck = await app.inject({ method: 'POST', url: `${DOMAINS}/${approved.id}/dns-check`, headers: auth('admin') });
    expect(recheck.json().data.dns_status).toBe('valid');

    const removed = await app.inject({ method: 'DELETE', url: `${DOMAINS}/${approved.id}`, headers: auth('admin') });
    expect(removed.json()).toEqual({ data: { id: approved.id, deleted: true } });
    expectErrorShape(await app.inject({ method: 'DELETE', url: `${DOMAINS}/${approved.id}`, headers: auth('admin') }), 404, 'NOT_FOUND');
    expectErrorShape(await app.inject({ method: 'PATCH', url: `${DOMAINS}/${MISSING}`, headers: auth('admin'), payload: { status: 'active' } }), 404, 'NOT_FOUND');
  });

  it('reads and sets the registration mode, and shows the audit trail', async () => {
    const before = await app.inject({ method: 'GET', url: POLICY, headers: auth('admin') });
    expect(before.json().data.registration_mode).toBe('open');
    const put = await app.inject({ method: 'PUT', url: POLICY, headers: auth('admin'), payload: { registration_mode: 'restricted' } });
    expect(put.json().data).toMatchObject({ registration_mode: 'restricted', updated_by: USERS.admin.id });
    expectErrorShape(await app.inject({ method: 'PUT', url: POLICY, headers: auth('admin'), payload: { registration_mode: 'closed' } }), 400, 'VALIDATION_ERROR');

    const audit = await app.inject({ method: 'GET', url: `${AUDIT}?limit=5`, headers: auth('admin') });
    expect(audit.json().data[0]).toMatchObject({ entity: 'policy', action: 'update', actor_id: USERS.admin.id });
  });

  describe.each([
    ['donor', 403, 'FORBIDDEN'],
    ['beneficiary', 403, 'FORBIDDEN'],
    ['volunteer', 403, 'FORBIDDEN'],
    ['sponsor', 403, 'FORBIDDEN'],
    ['noProfile', 403, 'FORBIDDEN'],
    ['suspended', 403, 'ACCOUNT_DISABLED'],
  ] as const)('%s', (user, status, code) => {
    it('cannot view or change domains, the policy or the audit log', async () => {
      const target = store.seed({ domain: 'foundation.org', policy_type: 'approved' });
      const requests = [
        { method: 'GET', url: DOMAINS },
        { method: 'POST', url: DOMAINS, payload: { domain: 'evil.example', policy_type: 'approved' } },
        { method: 'PATCH', url: `${DOMAINS}/${target.id}`, payload: { policy_type: 'blocked' } },
        { method: 'POST', url: `${DOMAINS}/${target.id}/dns-check` },
        { method: 'DELETE', url: `${DOMAINS}/${target.id}` },
        { method: 'GET', url: POLICY },
        { method: 'PUT', url: POLICY, payload: { registration_mode: 'restricted' } },
        { method: 'GET', url: AUDIT },
      ] as const;
      for (const request of requests) {
        expectErrorShape(await app.inject({ ...request, headers: auth(user) }), status, code);
      }
      expect(store.calls).toEqual([]);
      expect(store.policy.registration_mode).toBe('open');
    });
  });

  it('anonymous callers get 401 and cannot pass a role in headers', async () => {
    expectErrorShape(await app.inject({ method: 'GET', url: DOMAINS }), 401, 'UNAUTHORIZED');
    expectErrorShape(
      await app.inject({ method: 'PUT', url: POLICY, headers: { 'x-user-role': 'administrator' }, payload: { registration_mode: 'restricted' } }),
      401,
      'UNAUTHORIZED',
    );
    expect(store.calls).toEqual([]);
  });
});
