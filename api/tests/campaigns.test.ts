import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import type { AuthProfile, AuthProvider } from '../src/shared/types/auth.types.js';

// Campaign routes against the real supabase-js client with a fake fetch that stands in for
// PostgREST and the RLS policies on public.campaigns (admins: everything; other users: active
// campaigns only; writes: admins only). No network calls and no production data.
const SUPABASE_URL = 'https://example.supabase.co';
const PUBLISHABLE_KEY = 'test-publishable-key';
const BASE = '/api/v1/campaigns';

interface FakeAccount {
  id: string;
  email: string;
  profile: AuthProfile | null;
  /** administrator_profiles.id for this user, if any. */
  adminProfileId?: string;
}

const ACCOUNTS: Record<string, FakeAccount> = {
  'admin-token-abc123': {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'admin@example.org',
    profile: { role: 'administrator', accountStatus: 'active' },
    adminProfileId: 'a0a0a0a0-0000-4000-8000-000000000001',
  },
  'donor-token-def456': {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'donor@example.org',
    profile: { role: 'donor', accountStatus: 'active' },
  },
  'pending-token-jkl012': {
    id: '55555555-5555-4555-8555-555555555555',
    email: 'pending@example.org',
    profile: { role: 'volunteer', accountStatus: 'pending' },
  },
  'suspended-admin-token-mno345': {
    id: '66666666-6666-4666-8666-666666666666',
    email: 'suspended-admin@example.org',
    profile: { role: 'administrator', accountStatus: 'suspended' },
    adminProfileId: 'a0a0a0a0-0000-4000-8000-000000000006',
  },
  'admin-no-profile-token-stu901': {
    id: '88888888-8888-4888-8888-888888888888',
    email: 'admin2@example.org',
    profile: { role: 'administrator', accountStatus: 'active' },
  },
};
const ADMIN = { authorization: 'Bearer admin-token-abc123' };
const DONOR = { authorization: 'Bearer donor-token-def456' };
const PENDING = { authorization: 'Bearer pending-token-jkl012' };
const SUSPENDED_ADMIN = { authorization: 'Bearer suspended-admin-token-mno345' };
const ADMIN_NO_PROFILE = { authorization: 'Bearer admin-no-profile-token-stu901' };

const fakeAuthProvider: AuthProvider = {
  getUser: async (token) => {
    const account = ACCOUNTS[token];
    return account === undefined ? null : { id: account.id, email: account.email };
  },
  getProfile: async (userId, token) => {
    const account = ACCOUNTS[token];
    return account !== undefined && account.id === userId ? account.profile : null;
  },
};

type Row = Record<string, unknown>;

const ACTIVE_PUBLIC = 'c0000000-0000-4000-8000-000000000001';
const ACTIVE_PRIVATE = 'c0000000-0000-4000-8000-000000000002';
const DRAFT = 'c0000000-0000-4000-8000-000000000003';
const MISSING = 'c0000000-0000-4000-8000-0000000000ff';

function campaign(id: string, status: string, isPublic: boolean, createdAt: string): Row {
  return {
    id,
    admin_id: 'a0a0a0a0-0000-4000-8000-000000000001',
    title: `Campaign ${status}`,
    description: 'Food parcels',
    location: 'Soweto',
    start_date: '2026-10-01',
    end_date: '2026-12-31',
    status,
    category: 'food',
    image_url: null,
    funding_goal: 5000,
    amount_raised: 1200,
    is_public: isPublic,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

interface RecordedRequest {
  method: string;
  url: URL;
  authorization: string | null;
  apikey: string | null;
  body: unknown;
}

let campaigns: Row[] = [];
let requests: RecordedRequest[] = [];
/** Next PostgREST response override (simulated database errors). */
let failNext: { status: number; body: unknown } | 'network' | null = null;
/** Fails the next campaigns request with this HTTP method (other requests succeed). */
let failCampaigns: { method: string; status: number; body: unknown } | null = null;

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

function tokenOf(authorization: string | null): string {
  return authorization?.replace(/^Bearer /, '') ?? '';
}

function isAdmin(token: string): boolean {
  const account = ACCOUNTS[token];
  return account?.profile?.role === 'administrator' && account.profile.accountStatus !== 'suspended';
}

/** RLS on public.campaigns: admins see all rows, other users only active ones. */
function visibleTo(token: string): Row[] {
  return campaigns.filter((row) => isAdmin(token) || row.status === 'active');
}

function eqParam(url: URL, column: string): string | null {
  return url.searchParams.get(column)?.replace(/^eq\./, '') ?? null;
}

async function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : input.toString());
  const headers = new Headers(init?.headers);
  const method = (init?.method ?? 'GET').toUpperCase();
  const rawBody = typeof init?.body === 'string' ? init.body : undefined;
  const recorded: RecordedRequest = {
    method,
    url,
    authorization: headers.get('authorization'),
    apikey: headers.get('apikey'),
    body: rawBody === undefined ? undefined : JSON.parse(rawBody),
  };
  requests.push(recorded);

  if (failNext === 'network') {
    failNext = null;
    throw new TypeError('fetch failed');
  }
  if (failNext !== null) {
    const { status, body } = failNext;
    failNext = null;
    return json(status, body);
  }

  const token = tokenOf(recorded.authorization);
  const table = url.pathname.replace('/rest/v1/', '');
  if (table === 'campaigns' && failCampaigns !== null && failCampaigns.method === method) {
    const { status, body } = failCampaigns;
    failCampaigns = null;
    return json(status, body);
  }

  if (table === 'administrator_profiles' && method === 'GET') {
    const account = Object.values(ACCOUNTS).find((candidate) => candidate.id === eqParam(url, 'user_id'));
    const rows = isAdmin(token) && account?.adminProfileId !== undefined ? [{ id: account.adminProfileId }] : [];
    return json(200, rows);
  }

  if (table !== 'campaigns') return json(404, { code: 'PGRST205', message: 'unknown table' });

  if (method === 'GET' || method === 'HEAD') {
    const id = eqParam(url, 'id');
    const rows = visibleTo(token)
      .filter((row) => id === null || row.id === id)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || String(b.id).localeCompare(String(a.id)));
    const total = rows.length;
    if (method === 'HEAD') return new Response(null, { status: 200, headers: { 'content-range': `*/${total}` } });
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? rows.length);
    if (offset > 0 && offset >= total) {
      return json(416, { code: 'PGRST103', message: 'Requested range not satisfiable', details: `An offset of ${offset} was requested, but there are only ${total} rows.`, hint: null }, { 'content-range': `*/${total}` });
    }
    const page = rows.slice(offset, offset + limit);
    const range = page.length === 0 ? `*/${total}` : `${offset}-${offset + page.length - 1}/${total}`;
    return json(200, page, { 'content-range': range });
  }

  if (method === 'POST') {
    if (!isAdmin(token)) {
      return json(403, { code: '42501', message: 'new row violates row-level security policy for table "campaigns"', details: null, hint: null });
    }
    const now = '2026-10-02T10:00:00.000000+00:00';
    const row: Row = {
      id: 'c0000000-0000-4000-8000-0000000000aa',
      end_date: null,
      status: 'draft',
      category: null,
      image_url: null,
      funding_goal: null,
      amount_raised: 0,
      is_public: true,
      created_at: now,
      updated_at: now,
      ...(recorded.body as Row),
    };
    campaigns.push(row);
    return json(201, [row]);
  }

  if (method === 'PATCH') {
    const id = eqParam(url, 'id');
    const rows = isAdmin(token) ? campaigns.filter((row) => row.id === id) : [];
    for (const row of rows) Object.assign(row, recorded.body as Row, { updated_at: '2026-10-02T11:00:00.000000+00:00' });
    return json(200, rows);
  }

  return json(405, { code: 'PGRST117', message: `Unsupported HTTP method: ${method}` });
}

const createUserClient = (accessToken: string): SupabaseClient =>
  createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: fakeFetch, headers: { Authorization: `Bearer ${accessToken}` } },
  });

function expectErrorShape(response: LightMyRequestResponse, statusCode: number, code: string): void {
  expect(response.statusCode).toBe(statusCode);
  expect(response.json()).toEqual({ error: { code, message: expect.any(String) } });
}

const campaignRequests = (): RecordedRequest[] => requests.filter((r) => r.url.pathname === '/rest/v1/campaigns');

const VALID_BODY = {
  title: 'Winter blankets',
  description: 'Blankets for elderly residents',
  location: 'Alexandra',
  start_date: '2026-11-01',
  end_date: '2026-11-30',
  funding_goal: 10000,
};

describe('campaigns API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp(loadConfig(), { authProvider: fakeAuthProvider, createUserClient });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    campaigns = [
      campaign(ACTIVE_PUBLIC, 'active', true, '2026-10-01T08:00:00+00:00'),
      campaign(ACTIVE_PRIVATE, 'active', false, '2026-10-01T09:00:00+00:00'),
      campaign(DRAFT, 'draft', true, '2026-10-01T10:00:00+00:00'),
    ];
    requests = [];
    failNext = null;
    failCampaigns = null;
  });

  describe('authentication', () => {
    it.each([
      ['GET', BASE],
      ['GET', `${BASE}/${ACTIVE_PUBLIC}`],
    ] as const)('%s %s without a token returns 401 (anon has no SELECT grant on campaigns)', async (method, url) => {
      const response = await app.inject({ method, url });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(requests).toHaveLength(0);
    });

    it('POST without a token returns 401, even with an invalid body', async () => {
      const ok = await app.inject({ method: 'POST', url: BASE, payload: VALID_BODY });
      expectErrorShape(ok, 401, 'UNAUTHORIZED');
      const invalid = await app.inject({ method: 'POST', url: BASE, payload: { status: 'bogus' } });
      expectErrorShape(invalid, 401, 'UNAUTHORIZED');
      expect(requests).toHaveLength(0);
    });

    it('PATCH and DELETE without a token return 401', async () => {
      const patch = await app.inject({ method: 'PATCH', url: `${BASE}/${ACTIVE_PUBLIC}`, payload: { title: 'x' } });
      expectErrorShape(patch, 401, 'UNAUTHORIZED');
      const del = await app.inject({ method: 'DELETE', url: `${BASE}/${ACTIVE_PUBLIC}` });
      expectErrorShape(del, 401, 'UNAUTHORIZED');
      expect(requests).toHaveLength(0);
    });

    it('rejects an invalid token with 401', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: { authorization: 'Bearer not-a-real-token' } });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(response.body).not.toContain('not-a-real-token');
    });

    it('rejects a suspended account with 403 ACCOUNT_DISABLED on reads and writes', async () => {
      const list = await app.inject({ method: 'GET', url: BASE, headers: SUSPENDED_ADMIN });
      expectErrorShape(list, 403, 'ACCOUNT_DISABLED');
      const create = await app.inject({ method: 'POST', url: BASE, headers: SUSPENDED_ADMIN, payload: VALID_BODY });
      expectErrorShape(create, 403, 'ACCOUNT_DISABLED');
      expect(requests).toHaveLength(0);
    });

    it('maps an expired token rejected by PostgREST to 401', async () => {
      failNext = { status: 401, body: { code: 'PGRST303', message: 'JWT expired', details: null, hint: null } };
      const response = await app.inject({ method: 'GET', url: BASE, headers: DONOR });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('authorization', () => {
    it.each([
      ['donor', DONOR],
      ['pending volunteer', PENDING],
    ] as const)('%s gets 403 on POST, PATCH and DELETE without touching the database', async (_name, headers) => {
      const create = await app.inject({ method: 'POST', url: BASE, headers, payload: VALID_BODY });
      expectErrorShape(create, 403, 'FORBIDDEN');
      const patch = await app.inject({ method: 'PATCH', url: `${BASE}/${ACTIVE_PUBLIC}`, headers, payload: { title: 'x' } });
      expectErrorShape(patch, 403, 'FORBIDDEN');
      const del = await app.inject({ method: 'DELETE', url: `${BASE}/${ACTIVE_PUBLIC}`, headers });
      expectErrorShape(del, 403, 'FORBIDDEN');
      expect(requests).toHaveLength(0);
    });

    it('non-admin gets 403 (not 400) even with an invalid body', async () => {
      const response = await app.inject({ method: 'POST', url: BASE, headers: DONOR, payload: { status: 'bogus' } });
      expectErrorShape(response, 403, 'FORBIDDEN');
    });

    it('ignores a role injected by the client in the body, query or headers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${BASE}?role=administrator`,
        headers: { ...DONOR, 'x-user-role': 'administrator' },
        payload: { ...VALID_BODY, role: 'administrator', user: { role: 'administrator' } },
      });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(requests).toHaveLength(0);
    });

    it('admin creates a campaign (201) as themselves; admin_id comes from their administrator profile', async () => {
      const response = await app.inject({ method: 'POST', url: BASE, headers: ADMIN, payload: VALID_BODY });
      expect(response.statusCode).toBe(201);
      const body = response.json<{ data: Row }>();
      expect(body.data).toMatchObject({ ...VALID_BODY, admin_id: 'a0a0a0a0-0000-4000-8000-000000000001', amount_raised: 0, status: 'draft' });
      const lookup = requests.find((r) => r.url.pathname === '/rest/v1/administrator_profiles');
      expect(lookup?.url.searchParams.get('user_id')).toBe('eq.11111111-1111-4111-8111-111111111111');
      const insert = campaignRequests().find((r) => r.method === 'POST');
      expect(insert?.authorization).toBe('Bearer admin-token-abc123');
      expect(insert?.apikey).toBe(PUBLISHABLE_KEY);
    });

    it('admin without an administrator profile gets 403 and nothing is inserted', async () => {
      const response = await app.inject({ method: 'POST', url: BASE, headers: ADMIN_NO_PROFILE, payload: VALID_BODY });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(campaignRequests()).toHaveLength(0);
    });

    it('admin updates a campaign (200)', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `${BASE}/${DRAFT}`,
        headers: ADMIN,
        payload: { status: 'active', is_public: true, title: '  Renamed  ' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row }>().data).toMatchObject({ id: DRAFT, status: 'active', is_public: true, title: 'Renamed' });
    });

    it('admin DELETE archives (status cancelled) instead of deleting', async () => {
      const response = await app.inject({ method: 'DELETE', url: `${BASE}/${ACTIVE_PUBLIC}`, headers: ADMIN });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row }>().data).toMatchObject({ id: ACTIVE_PUBLIC, status: 'cancelled' });
      expect(campaignRequests().map((r) => r.method)).toEqual(['PATCH']);
      expect(campaignRequests()[0]?.body).toEqual({ status: 'cancelled' });
      expect(campaigns).toHaveLength(3);
    });

    it('maps an RLS rejection of a write to 403 without exposing the database message', async () => {
      // The admin passes requireRole, but the database refuses the row.
      failCampaigns = { method: 'POST', status: 403, body: { code: '42501', message: 'new row violates row-level security policy for table "campaigns"', details: null, hint: null } };
      const response = await app.inject({ method: 'POST', url: BASE, headers: ADMIN, payload: VALID_BODY });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(response.body).not.toContain('row-level security');
    });

    it('PATCH/DELETE of a campaign RLS does not let the caller write returns 404', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${BASE}/${MISSING}`, headers: ADMIN, payload: { title: 'x' } });
      expectErrorShape(response, 404, 'NOT_FOUND');
      const del = await app.inject({ method: 'DELETE', url: `${BASE}/${MISSING}`, headers: ADMIN });
      expectErrorShape(del, 404, 'NOT_FOUND');
    });
  });

  describe('validation', () => {
    it.each(['title', 'description', 'location', 'start_date'])('POST without %s returns 400', async (field) => {
      const payload: Record<string, unknown> = { ...VALID_BODY };
      delete payload[field];
      const response = await app.inject({ method: 'POST', url: BASE, headers: ADMIN, payload });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(campaignRequests()).toHaveLength(0);
    });

    it.each([
      ['blank title', { title: '   ' }],
      ['title too long', { title: 'x'.repeat(201) }],
      ['description too long', { description: 'x'.repeat(5001) }],
      ['category too long', { category: 'x'.repeat(101) }],
      ['unknown status', { status: 'archived' }],
      ['negative funding goal', { funding_goal: -5 }],
      ['non-numeric funding goal', { funding_goal: 'lots' }],
      ['bad date format', { start_date: '01/11/2026' }],
      ['impossible date', { start_date: '2026-02-30' }],
      ['end before start', { start_date: '2026-11-10', end_date: '2026-11-01' }],
      ['non-http image URL', { image_url: 'javascript:alert(1)' }],
      ['ftp image URL', { image_url: 'ftp://example.org/a.png' }],
      ['not a URL', { image_url: 'campaign.png' }],
      ['non-boolean is_public', { is_public: 'maybe' }],
    ])('POST with %s returns 400', async (_name, override) => {
      const response = await app.inject({ method: 'POST', url: BASE, headers: ADMIN, payload: { ...VALID_BODY, ...override } });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(campaignRequests()).toHaveLength(0);
    });

    it('accepts optional nullable fields and an https image URL', async () => {
      const response = await app.inject({
        method: 'POST',
        url: BASE,
        headers: ADMIN,
        payload: { ...VALID_BODY, end_date: null, category: null, funding_goal: null, image_url: 'https://example.supabase.co/storage/v1/object/public/campaign-images/a.png', status: 'active', is_public: false },
      });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({ end_date: null, category: null, funding_goal: null, status: 'active', is_public: false });
    });

    it('accepts a funding goal of 0 (live CHECK: funding_goal IS NULL OR funding_goal >= 0)', async () => {
      const response = await app.inject({ method: 'POST', url: BASE, headers: ADMIN, payload: { ...VALID_BODY, funding_goal: 0 } });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data.funding_goal).toBe(0);
      expect(campaignRequests().find((r) => r.method === 'POST')?.body).toMatchObject({ funding_goal: 0 });
    });

    it('PATCH with a bad status returns 400', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${BASE}/${DRAFT}`, headers: ADMIN, payload: { status: 'deleted' } });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
    });

    it('PATCH with an empty body, or only protected fields, returns 400', async () => {
      const empty = await app.inject({ method: 'PATCH', url: `${BASE}/${DRAFT}`, headers: ADMIN, payload: {} });
      expectErrorShape(empty, 400, 'VALIDATION_ERROR');
      const protectedOnly = await app.inject({
        method: 'PATCH',
        url: `${BASE}/${DRAFT}`,
        headers: ADMIN,
        payload: { amount_raised: 999999, admin_id: '99999999-9999-4999-8999-999999999999', id: MISSING },
      });
      expectErrorShape(protectedOnly, 400, 'VALIDATION_ERROR');
      expect(campaignRequests().filter((r) => r.method === 'PATCH')).toHaveLength(0);
    });

    it('PATCH end_date before the stored start_date returns 400', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${BASE}/${DRAFT}`, headers: ADMIN, payload: { end_date: '2026-09-01' } });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(response.json<{ error: { message: string } }>().error.message).toBe('end_date must be on or after start_date');
      expect(campaignRequests().filter((r) => r.method === 'PATCH')).toHaveLength(0);
    });

    it.each([
      ['GET', 'not-a-uuid'],
      ['PATCH', '123'],
      ['DELETE', 'abc'],
    ] as const)('%s with an invalid id (%s) returns 400', async (method, id) => {
      const response = await app.inject({ method, url: `${BASE}/${id}`, headers: ADMIN, ...(method === 'PATCH' ? { payload: { title: 'x' } } : {}) });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(requests).toHaveLength(0);
    });

    it.each(['page=0', 'pageSize=0', 'pageSize=101', 'page=abc'])('GET with invalid pagination (%s) returns 400', async (query) => {
      const response = await app.inject({ method: 'GET', url: `${BASE}?${query}`, headers: DONOR });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
    });
  });

  describe('reads', () => {
    it('lists campaigns with { data, meta } and default pagination', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: ADMIN });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: unknown }>();
      expect(body.meta).toEqual({ page: 1, pageSize: 20, total: 3, totalPages: 1 });
      expect(body.data.map((row) => row.id)).toEqual([DRAFT, ACTIVE_PRIVATE, ACTIVE_PUBLIC]);
      const query = campaignRequests()[0]?.url.searchParams;
      expect(query?.get('order')).toBe('created_at.desc,id.desc');
      expect(query?.get('offset')).toBe('0');
      expect(query?.get('limit')).toBe('20');
    });

    it('paginates with page and pageSize', async () => {
      const response = await app.inject({ method: 'GET', url: `${BASE}?page=2&pageSize=2`, headers: ADMIN });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: unknown }>();
      expect(body.meta).toEqual({ page: 2, pageSize: 2, total: 3, totalPages: 2 });
      expect(body.data.map((row) => row.id)).toEqual([ACTIVE_PUBLIC]);
    });

    it('returns an empty page with the real total past the last page', async () => {
      const response = await app.inject({ method: 'GET', url: `${BASE}?page=5&pageSize=2`, headers: ADMIN });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ data: [], meta: { page: 5, pageSize: 2, total: 3, totalPages: 2 } });
    });

    it('returns only what RLS lets the caller see (non-admin: active campaigns)', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: DONOR });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: { total: number } }>();
      expect(body.data.map((row) => row.id)).toEqual([ACTIVE_PRIVATE, ACTIVE_PUBLIC]);
      expect(body.meta.total).toBe(2);
      expect(campaignRequests()[0]?.authorization).toBe('Bearer donor-token-def456');
    });

    it('returns a single campaign', async () => {
      const response = await app.inject({ method: 'GET', url: `${BASE}/${ACTIVE_PUBLIC}`, headers: DONOR });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ data: campaign(ACTIVE_PUBLIC, 'active', true, '2026-10-01T08:00:00+00:00') });
    });

    it('returns the same 404 for a missing campaign and one hidden by RLS', async () => {
      const missing = await app.inject({ method: 'GET', url: `${BASE}/${MISSING}`, headers: DONOR });
      const hidden = await app.inject({ method: 'GET', url: `${BASE}/${DRAFT}`, headers: DONOR });
      expectErrorShape(missing, 404, 'NOT_FOUND');
      expectErrorShape(hidden, 404, 'NOT_FOUND');
      expect(hidden.body).toBe(missing.body);
      const visibleToAdmin = await app.inject({ method: 'GET', url: `${BASE}/${DRAFT}`, headers: ADMIN });
      expect(visibleToAdmin.statusCode).toBe(200);
    });
  });

  describe('security', () => {
    it('strips protected and system fields on POST; the insert only carries writable fields + server admin_id', async () => {
      const response = await app.inject({
        method: 'POST',
        url: BASE,
        headers: ADMIN,
        payload: {
          ...VALID_BODY,
          id: MISSING,
          admin_id: '99999999-9999-4999-8999-999999999999',
          amount_raised: 1000000,
          created_at: '2020-01-01T00:00:00Z',
          updated_at: '2020-01-01T00:00:00Z',
          role: 'administrator',
        },
      });
      expect(response.statusCode).toBe(201);
      const insert = campaignRequests().find((r) => r.method === 'POST');
      expect(insert?.body).toEqual({ ...VALID_BODY, admin_id: 'a0a0a0a0-0000-4000-8000-000000000001' });
      const data = response.json<{ data: Row }>().data;
      expect(data.amount_raised).toBe(0);
      expect(data.id).not.toBe(MISSING);
    });

    it('strips protected fields on PATCH', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `${BASE}/${DRAFT}`,
        headers: ADMIN,
        payload: { title: 'New title', amount_raised: 1, admin_id: MISSING, created_at: '2020-01-01T00:00:00Z' },
      });
      expect(response.statusCode).toBe(200);
      expect(campaignRequests().find((r) => r.method === 'PATCH')?.body).toEqual({ title: 'New title' });
    });

    it('uses the caller token and the publishable key only, and never returns credentials', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: ADMIN });
      expect(response.statusCode).toBe(200);
      for (const request of requests) {
        expect(request.apikey).toBe(PUBLISHABLE_KEY);
        expect(request.authorization).toBe('Bearer admin-token-abc123');
      }
      expect(response.body).not.toContain(PUBLISHABLE_KEY);
      expect(response.body).not.toContain('admin-token-abc123');
      expect(response.body.toLowerCase()).not.toContain('service_role');
      expect(response.headers['authorization']).toBeUndefined();
    });

    it('does not expose raw database errors (500 with a generic message)', async () => {
      failNext = { status: 400, body: { code: '42703', message: 'column campaigns.secret does not exist', details: 'leaky details', hint: 'leaky hint' } };
      const response = await app.inject({ method: 'GET', url: BASE, headers: ADMIN });
      expectErrorShape(response, 500, 'INTERNAL_ERROR');
      expect(response.body).not.toMatch(/column|secret|leaky|42703/);
    });

    it('maps a check-constraint violation to a generic 400', async () => {
      failCampaigns = { method: 'POST', status: 400, body: { code: '23514', message: 'new row for relation "campaigns" violates check constraint "campaigns_goal_check"', details: null, hint: null } };
      const response = await app.inject({ method: 'POST', url: BASE, headers: ADMIN, payload: VALID_BODY });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(response.body).not.toContain('campaigns_goal_check');
    });

    it.each([
      ['a 5xx response', { status: 502, body: { message: 'bad gateway' } }],
      ['a network failure', 'network' as const],
    ])('returns 503 for %s', async (_name, failure) => {
      failNext = failure;
      const response = await app.inject({ method: 'GET', url: `${BASE}/${ACTIVE_PUBLIC}`, headers: DONOR });
      expectErrorShape(response, 503, 'SERVICE_UNAVAILABLE');
      expect(response.body).not.toMatch(/bad gateway|fetch failed/);
    });
  });

  describe('OpenAPI docs', () => {
    it('documents every campaign endpoint with bearer auth and error responses', async () => {
      const response = await app.inject({ method: 'GET', url: '/docs/json' });
      expect(response.statusCode).toBe(200);
      const spec = response.json<{
        paths: Record<string, Record<string, { security?: unknown; responses: Record<string, unknown>; tags?: string[] }>>;
      }>();
      const collection = spec.paths['/api/v1/campaigns/'] ?? spec.paths['/api/v1/campaigns'];
      const item = spec.paths['/api/v1/campaigns/{id}'];
      const operations = [collection?.['get'], collection?.['post'], item?.['get'], item?.['patch'], item?.['delete']];
      for (const operation of operations) {
        expect(operation?.security).toEqual([{ bearerAuth: [] }]);
        expect(operation?.tags).toEqual(['campaigns']);
        expect(Object.keys(operation?.responses ?? {})).toEqual(expect.arrayContaining(['400', '401', '403', '500', '503']));
      }
      expect(Object.keys(collection?.['post']?.responses ?? {})).toContain('201');
      for (const operation of [item?.['get'], item?.['patch'], item?.['delete']]) {
        expect(Object.keys(operation?.responses ?? {})).toContain('404');
      }
    });
  });
});
