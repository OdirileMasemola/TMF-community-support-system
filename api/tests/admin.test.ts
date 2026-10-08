import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FakeSupabase, expectErrorShape, type Row } from './helpers/fakeSupabase.js';
import { ACCOUNTS, ROLE_IDS, USERS, auth, seedWith } from './helpers/fixtures.js';

// Admin dashboard and user management against the real supabase-js client and the in-memory
// PostgREST/RLS emulation.
const V1 = '/api/v1';
const DASHBOARD = `${V1}/admin/dashboard`;
const USERS_URL = `${V1}/admin/users`;
const statusUrl = (id: string) => `${USERS_URL}/${id}/status`;
const db = new FakeSupabase(ACCOUNTS);

const C = (n: number) => `ca000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const D = (n: number) => `d1000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const MISSING = '99999999-9999-4999-8999-999999999999';
const NEW_USER = '9a000000-0000-4000-8000-000000000001';

function campaign(n: number, status: string): Row {
  return { id: C(n), admin_id: ROLE_IDS.admin, title: `Campaign ${n}`, description: 'Help', location: 'Soweto', start_date: '2026-10-01', status };
}

function donation(n: number, status: string, amount: number | null, kind = 'money'): Row {
  return { id: D(n), donor_id: ROLE_IDS.donor, amount, status, donation_kind: kind, payment_method: 'EFT', donation_date: '2026-10-01T08:00:00+00:00' };
}

function extraSeed(): Record<string, Row[]> {
  return {
    profiles: [
      { id: NEW_USER, role: 'beneficiary', full_name: "Nomsa O'Neil", email: 'nomsa@sample.net', account_status: 'pending', created_at: '2026-10-08T10:00:00+00:00' },
    ],
    campaigns: [campaign(1, 'active'), campaign(2, 'active'), campaign(3, 'draft')],
    donations: [
      donation(1, 'successful', 0.1),
      donation(2, 'successful', 19.99),
      donation(3, 'successful', null, 'in_kind'),
      donation(4, 'pending', 50),
      donation(5, 'failed', 30),
    ],
    donation_proofs: [
      { donation_id: D(4), file_path: `${USERS.donor.id}/a.pdf`, verification_status: 'pending' },
      { donation_id: D(1), file_path: `${USERS.donor.id}/b.pdf`, verification_status: 'approved' },
    ],
    assistance_requests: [
      { beneficiary_id: ROLE_IDS.beneficiary, request_type: 'food', description: 'Food', status: 'pending' },
      { beneficiary_id: ROLE_IDS.beneficiary, request_type: 'food', description: 'Food', status: 'under_review' },
      { beneficiary_id: ROLE_IDS.beneficiary2, request_type: 'food', description: 'Food', status: 'approved' },
    ],
    campaign_applications: [
      { volunteer_id: ROLE_IDS.volunteer, campaign_id: C(1), status: 'pending' },
      { volunteer_id: ROLE_IDS.volunteer2, campaign_id: C(1), status: 'approved' },
    ],
    sponsorships: [
      { sponsor_id: ROLE_IDS.sponsor, amount: 1000, status: 'pending' },
      { sponsor_id: ROLE_IDS.sponsor2, amount: 500, status: 'successful' },
    ],
    sponsorship_requests: [
      { title: 'Transport', requested_support: 'Bus', status: 'open' },
      { title: 'Food', requested_support: 'Parcels', status: 'closed' },
    ],
    events: [
      { admin_id: ROLE_IDS.admin, title: 'Drive', location: 'Soweto', event_date: '2026-11-01T08:00:00+00:00', status: 'scheduled' },
      { admin_id: ROLE_IDS.admin, title: 'Draft', location: 'Soweto', event_date: '2026-12-01T08:00:00+00:00', status: 'draft' },
    ],
  };
}

describe('admin API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await db.buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    db.reset(seedWith(extraSeed()));
  });

  describe('authentication and roles', () => {
    it.each([
      ['GET', DASHBOARD],
      ['GET', USERS_URL],
      ['PATCH', statusUrl(USERS.donor.id)],
    ] as const)('%s %s without a token returns 401', async (method, url) => {
      const response = await app.inject({ method, url });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(db.requests).toHaveLength(0);
    });

    it.each([
      ['donor', 'GET', DASHBOARD],
      ['volunteer', 'GET', USERS_URL],
      ['sponsor', 'PATCH', statusUrl(USERS.donor.id)],
      ['beneficiary', 'PATCH', statusUrl(USERS.donor.id)],
    ] as const)('%s cannot %s %s (403)', async (user, method, url) => {
      const payload = method === 'PATCH' ? { account_status: 'active' } : undefined;
      const response = await app.inject({ method, url, headers: auth(user), payload });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(db.requests).toHaveLength(0);
    });

    it('rejects a suspended account with 403 ACCOUNT_DISABLED', async () => {
      expectErrorShape(await app.inject({ method: 'GET', url: DASHBOARD, headers: auth('suspended') }), 403, 'ACCOUNT_DISABLED');
    });
  });

  describe('GET /admin/dashboard', () => {
    it('returns the totals as the administrator', async () => {
      const response = await app.inject({ method: 'GET', url: DASHBOARD, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        data: {
          users: {
            total: 13,
            pending: 2,
            suspended: 1,
            byRole: { administrator: 2, donor: 4, volunteer: 2, beneficiary: 3, sponsor: 2 },
          },
          campaigns: { total: 3, active: 2 },
          // 0.10 + 19.99 (in-kind and non-successful donations are left out), without float drift.
          donations: { total: 5, successfulAmount: 20.09, pendingProofs: 1 },
          assistanceRequests: { total: 3, awaitingReview: 2 },
          volunteers: { pendingApplications: 1 },
          sponsorships: { total: 2, openRequests: 1 },
          events: { scheduled: 1 },
        },
      });
      // Counts are head-only requests; only the amounts are read, and only successful money donations.
      const reads = db.requests.filter((r) => r.method === 'GET');
      expect(reads.map((r) => r.target)).toEqual(['donations']);
      expect(reads[0]?.url.searchParams.get('select')).toBe('amount');
      expect(reads[0]?.url.searchParams.get('status')).toBe('eq.successful');
      expect(reads[0]?.url.searchParams.get('donation_kind')).toBe('eq.money');
      expect(db.requests.every((r) => r.authorization === `Bearer ${USERS.admin.token}`)).toBe(true);
    });

    it('adds up successful donations beyond one 1000-row chunk', async () => {
      db.reset(seedWith({ donations: Array.from({ length: 1001 }, (_, i) => donation(100 + i, 'successful', 1.01)) }));
      const response = await app.inject({ method: 'GET', url: DASHBOARD, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      expect(response.json().data.donations).toEqual({ total: 1001, successfulAmount: 1011.01, pendingProofs: 0 });
      const offsets = db.requestsTo('donations', 'GET').map((r) => r.url.searchParams.get('offset'));
      expect(offsets).toEqual(['0', '1000']);
    });

    it('returns zeros when there is no data', async () => {
      db.reset(seedWith({}));
      const response = await app.inject({ method: 'GET', url: DASHBOARD, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      const data = response.json().data;
      expect(data.campaigns).toEqual({ total: 0, active: 0 });
      expect(data.donations).toEqual({ total: 0, successfulAmount: 0, pendingProofs: 0 });
      expect(data.events).toEqual({ scheduled: 0 });
    });

    it('maps a failed count to 503 and a failed sum to 503', async () => {
      db.failNext('network', { target: 'events' });
      expectErrorShape(await app.inject({ method: 'GET', url: DASHBOARD, headers: auth('admin') }), 503, 'SERVICE_UNAVAILABLE');
      db.failNext('network', { target: 'donations', method: 'GET' });
      expectErrorShape(await app.inject({ method: 'GET', url: DASHBOARD, headers: auth('admin') }), 503, 'SERVICE_UNAVAILABLE');
    });
  });

  describe('GET /admin/users', () => {
    it('lists every profile newest first with pagination meta', async () => {
      const response = await app.inject({ method: 'GET', url: USERS_URL, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.meta).toEqual({ page: 1, pageSize: 20, total: 13, totalPages: 1 });
      expect(body.data).toHaveLength(13);
      expect(body.data[0]).toEqual({
        id: NEW_USER,
        role: 'beneficiary',
        full_name: "Nomsa O'Neil",
        email: 'nomsa@sample.net',
        phone_number: null,
        account_status: 'pending',
        avatar_url: null,
        invited_by: null,
        invited_at: null,
        created_at: '2026-10-08T10:00:00+00:00',
        updated_at: expect.any(String),
      });
      // Same created_at: newest-first falls back to id descending.
      const rest = body.data.slice(1).map((user: { id: string }) => user.id);
      expect(rest).toEqual([...rest].sort().reverse());
      const request = db.requestsTo('profiles', 'GET').at(-1);
      expect(request?.url.searchParams.get('order')).toBe('created_at.desc,id.desc');
    });

    it('filters by role and account status', async () => {
      const donors = await app.inject({ method: 'GET', url: `${USERS_URL}?role=donor`, headers: auth('admin') });
      expect(donors.json().meta.total).toBe(4);
      expect(donors.json().data.every((user: { role: string }) => user.role === 'donor')).toBe(true);

      const pendingDonors = await app.inject({ method: 'GET', url: `${USERS_URL}?role=donor&status=pending`, headers: auth('admin') });
      expect(pendingDonors.json().data.map((user: { id: string }) => user.id)).toEqual([USERS.pendingDonor.id]);

      const suspended = await app.inject({ method: 'GET', url: `${USERS_URL}?status=suspended`, headers: auth('admin') });
      expect(suspended.json().data.map((user: { id: string }) => user.id)).toEqual([USERS.suspended.id]);
      expect(db.requestsTo('profiles', 'GET').at(-1)?.url.searchParams.get('account_status')).toBe('eq.suspended');
    });

    it('searches full name or email case-insensitively', async () => {
      const byName = await app.inject({ method: 'GET', url: `${USERS_URL}?search=SIPHO`, headers: auth('admin') });
      expect(byName.json().data.map((user: { id: string }) => user.id)).toEqual([USERS.sponsor.id]);
      expect(db.requestsTo('profiles', 'GET').at(-1)?.url.searchParams.get('or')).toBe('(full_name.ilike.%SIPHO%,email.ilike.%SIPHO%)');

      const byEmail = await app.inject({ method: 'GET', url: `${USERS_URL}?search=sample.net`, headers: auth('admin') });
      expect(byEmail.json().data.map((user: { id: string }) => user.id)).toEqual([NEW_USER]);

      const apostrophe = await app.inject({ method: 'GET', url: `${USERS_URL}?search=${encodeURIComponent("o'neil")}`, headers: auth('admin') });
      expect(apostrophe.json().meta.total).toBe(1);

      const accented = await app.inject({ method: 'GET', url: `${USERS_URL}?search=${encodeURIComponent('Zoë Ndlovu-Smith')}`, headers: auth('admin') });
      expect(accented.statusCode).toBe(200);
      expect(accented.json().meta.total).toBe(0);

      const combined = await app.inject({ method: 'GET', url: `${USERS_URL}?search=example.org&role=sponsor`, headers: auth('admin') });
      expect(combined.json().meta.total).toBe(2);
    });

    it('ignores a blank search', async () => {
      const response = await app.inject({ method: 'GET', url: `${USERS_URL}?search=%20%20`, headers: auth('admin') });
      expect(response.json().meta.total).toBe(13);
      expect(db.requestsTo('profiles', 'GET').at(-1)?.url.searchParams.has('or')).toBe(false);
    });

    it.each([
      ['a comma', 'a,b'],
      ['parentheses', 'a)'],
      ['a % wildcard', '%'],
      ['a * wildcard', 'a*'],
      ['a double quote', 'a"b'],
      ['a too-long term', 'a'.repeat(101)],
    ])('rejects a search with %s (400)', async (_label, term) => {
      const response = await app.inject({ method: 'GET', url: `${USERS_URL}?search=${encodeURIComponent(term)}`, headers: auth('admin') });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });

    it.each([
      ['an unknown role', 'role=admin'],
      ['an unknown status', 'status=banned'],
      ['a page of 0', 'page=0'],
    ])('rejects %s (400)', async (_label, query) => {
      expectErrorShape(await app.inject({ method: 'GET', url: `${USERS_URL}?${query}`, headers: auth('admin') }), 400, 'VALIDATION_ERROR');
    });

    it('pages through the users and returns an empty page past the end', async () => {
      const third = await app.inject({ method: 'GET', url: `${USERS_URL}?page=3&pageSize=5`, headers: auth('admin') });
      expect(third.json().data).toHaveLength(3);
      expect(third.json().meta).toEqual({ page: 3, pageSize: 5, total: 13, totalPages: 3 });

      const past = await app.inject({ method: 'GET', url: `${USERS_URL}?page=9&pageSize=5`, headers: auth('admin') });
      expect(past.statusCode).toBe(200);
      expect(past.json()).toEqual({ data: [], meta: { page: 9, pageSize: 5, total: 13, totalPages: 3 } });
    });

    it('maps a data service failure to 503', async () => {
      db.failNext('network', { target: 'profiles', method: 'GET' });
      expectErrorShape(await app.inject({ method: 'GET', url: USERS_URL, headers: auth('admin') }), 503, 'SERVICE_UNAVAILABLE');
    });
  });

  describe('PATCH /admin/users/:id/status', () => {
    it('suspends another user and sends only account_status', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: statusUrl(USERS.donor.id),
        headers: auth('admin'),
        payload: { account_status: 'suspended', role: 'administrator', full_name: 'Hacked' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json().data).toMatchObject({ id: USERS.donor.id, role: 'donor', full_name: 'Dineo Donor', account_status: 'suspended' });
      const patch = db.requestsTo('profiles', 'PATCH');
      expect(patch).toHaveLength(1);
      expect(patch[0]?.body).toEqual({ account_status: 'suspended' });
      expect(patch[0]?.url.searchParams.get('id')).toBe(`eq.${USERS.donor.id}`);
      expect(db.find('profiles', (row) => row.id === USERS.donor.id)).toMatchObject({ role: 'donor', account_status: 'suspended' });

      // The suspended user is now refused.
      expectErrorShape(await app.inject({ method: 'GET', url: `${V1}/me`, headers: auth('donor') }), 403, 'ACCOUNT_DISABLED');
    });

    it('activates a pending user and reactivates a suspended one', async () => {
      const pending = await app.inject({ method: 'PATCH', url: statusUrl(USERS.pendingDonor.id), headers: auth('admin'), payload: { account_status: 'active' } });
      expect(pending.statusCode).toBe(200);
      expect(pending.json().data.account_status).toBe('active');

      const suspended = await app.inject({ method: 'PATCH', url: statusUrl(USERS.suspended.id), headers: auth('admin'), payload: { account_status: 'active' } });
      expect(suspended.json().data.account_status).toBe('active');
      expect((await app.inject({ method: 'GET', url: `${V1}/me`, headers: auth('suspended') })).statusCode).toBe(200);
    });

    it('lets an administrator suspend another administrator (the database allows it)', async () => {
      const response = await app.inject({ method: 'PATCH', url: statusUrl(USERS.admin2.id), headers: auth('admin'), payload: { account_status: 'suspended' } });
      expect(response.statusCode).toBe(200);
      expectErrorShape(await app.inject({ method: 'GET', url: DASHBOARD, headers: auth('admin2') }), 403, 'ACCOUNT_DISABLED');
    });

    it('refuses to change your own status (409) without calling the database', async () => {
      const response = await app.inject({ method: 'PATCH', url: statusUrl(USERS.admin.id), headers: auth('admin'), payload: { account_status: 'suspended' } });
      expectErrorShape(response, 409, 'CONFLICT');
      expect(db.requestsTo('profiles', 'PATCH')).toHaveLength(0);
      expect(db.find('profiles', (row) => row.id === USERS.admin.id)?.account_status).toBe('active');
    });

    it('returns 404 for an unknown user', async () => {
      const response = await app.inject({ method: 'PATCH', url: statusUrl(MISSING), headers: auth('admin'), payload: { account_status: 'active' } });
      expectErrorShape(response, 404, 'NOT_FOUND');
    });

    it.each([
      ['no body', undefined],
      ['no account_status', {}],
      ['an unknown status', { account_status: 'banned' }],
      ['a null status', { account_status: null }],
    ])('rejects %s (400)', async (_label, payload) => {
      const response = await app.inject({ method: 'PATCH', url: statusUrl(USERS.donor.id), headers: auth('admin'), payload });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requestsTo('profiles', 'PATCH')).toHaveLength(0);
    });

    it('rejects a malformed id (400)', async () => {
      expectErrorShape(await app.inject({ method: 'PATCH', url: statusUrl('nope'), headers: auth('admin'), payload: { account_status: 'active' } }), 400, 'VALIDATION_ERROR');
    });

    it('maps a database refusal to 403 and a network failure to 503', async () => {
      db.failNext({ status: 403, body: { code: '42501', message: 'Not allowed', details: null, hint: null } }, { target: 'profiles', method: 'PATCH' });
      expectErrorShape(await app.inject({ method: 'PATCH', url: statusUrl(USERS.donor.id), headers: auth('admin'), payload: { account_status: 'active' } }), 403, 'FORBIDDEN');
      db.failNext('network', { target: 'profiles', method: 'PATCH' });
      expectErrorShape(await app.inject({ method: 'PATCH', url: statusUrl(USERS.donor.id), headers: auth('admin'), payload: { account_status: 'active' } }), 503, 'SERVICE_UNAVAILABLE');
    });
  });
});
