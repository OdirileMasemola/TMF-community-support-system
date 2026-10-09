import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FakeSupabase, expectErrorShape, type Row } from './helpers/fakeSupabase.js';
import { ACCOUNTS, ROLE_IDS, USERS, auth, baseSeed, seedWith } from './helpers/fixtures.js';

// Sponsorships, sponsorship requests and responses against the real supabase-js client and the
// in-memory PostgREST/RLS emulation.
const V1 = '/api/v1';
const SPONSORSHIPS = `${V1}/sponsorships`;
const REQUESTS = `${V1}/sponsorship-requests`;
const db = new FakeSupabase(ACCOUNTS);

const C = (n: number) => `ca000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const SP = (n: number) => `5b000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const Q = (n: number) => `5e000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const RS = (n: number) => `5f000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const MISSING = '99999999-9999-4999-8999-999999999999';

function campaign(n: number, status: string): Row {
  return { id: C(n), admin_id: ROLE_IDS.admin, title: `Campaign ${n}`, description: 'Help', location: 'Soweto', start_date: '2026-10-01', status, funding_goal: 10000 };
}

function sponsorship(n: number, sponsorId: string, campaignId: string | null, amount: number, status: string, date: string): Row {
  return { id: SP(n), sponsor_id: sponsorId, campaign_id: campaignId, amount, status, sponsorship_date: date, sponsorship_type: 'financial' };
}

function sponsorshipRequest(n: number, status: string, createdAt: string, campaignId: string | null = null): Row {
  return { id: Q(n), campaign_id: campaignId, title: `Request ${n}`, requested_support: 'Transport', status, created_at: createdAt, created_by: ROLE_IDS.admin };
}

describe('sponsorships API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await db.buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    db.reset(
      seedWith({
        campaigns: [campaign(1, 'active'), campaign(2, 'draft'), campaign(3, 'closed')],
        sponsorships: [
          sponsorship(1, ROLE_IDS.sponsor, C(1), 1000, 'pending', '2026-10-01T08:00:00+00:00'),
          sponsorship(2, ROLE_IDS.sponsor, null, 500, 'successful', '2026-10-02T08:00:00+00:00'),
          sponsorship(3, ROLE_IDS.sponsor2, C(1), 750, 'pending', '2026-10-03T08:00:00+00:00'),
          sponsorship(4, ROLE_IDS.sponsor, C(3), 200, 'failed', '2026-09-01T08:00:00+00:00'),
        ],
        sponsorship_requests: [
          sponsorshipRequest(1, 'open', '2026-10-01T08:00:00+00:00', C(1)),
          sponsorshipRequest(2, 'open', '2026-10-03T08:00:00+00:00'),
          sponsorshipRequest(3, 'closed', '2026-10-02T08:00:00+00:00'),
          sponsorshipRequest(4, 'accepted', '2026-09-20T08:00:00+00:00'),
        ],
        sponsorship_request_responses: [
          {
            id: RS(1),
            request_id: Q(1),
            sponsor_id: ROLE_IDS.sponsor2,
            sponsorship_id: null,
            status: 'interested',
            notes: 'Keen',
            responded_at: '2026-10-04T08:00:00+00:00',
          },
        ],
      }),
    );
  });

  describe('authentication and roles', () => {
    it.each([
      ['POST', SPONSORSHIPS],
      ['GET', SPONSORSHIPS],
      ['GET', `${SPONSORSHIPS}/me`],
      ['GET', REQUESTS],
      ['PATCH', `${SPONSORSHIPS}/${SP(1)}`],
      ['POST', REQUESTS],
      ['PATCH', `${REQUESTS}/${Q(1)}`],
      ['GET', `${V1}/sponsorship-request-responses/me`],
      ['POST', `${REQUESTS}/${Q(1)}/responses`],
    ] as const)('%s %s without a token returns 401', async (method, url) => {
      const response = await app.inject({ method, url });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(db.requests).toHaveLength(0);
    });

    it.each([
      ['donor', 'POST', SPONSORSHIPS],
      ['admin', 'POST', SPONSORSHIPS],
      ['sponsor', 'GET', SPONSORSHIPS],
      ['admin', 'GET', `${SPONSORSHIPS}/me`],
      ['volunteer', 'GET', REQUESTS],
      ['sponsor', 'PATCH', `${SPONSORSHIPS}/${SP(1)}`],
      ['sponsor', 'POST', REQUESTS],
      ['donor', 'PATCH', `${REQUESTS}/${Q(1)}`],
      ['donor', 'GET', `${V1}/sponsorship-request-responses/me`],
      ['admin', 'GET', `${V1}/sponsorship-request-responses/me`],
      ['admin', 'POST', `${REQUESTS}/${Q(1)}/responses`],
    ] as const)('%s cannot %s %s (403)', async (user, method, url) => {
      const response = await app.inject({ method, url, headers: auth(user), payload: method === 'GET' ? undefined : {} });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(db.requests).toHaveLength(0);
    });

    it('rejects a suspended account with 403 ACCOUNT_DISABLED', async () => {
      expectErrorShape(await app.inject({ method: 'GET', url: REQUESTS, headers: auth('suspended') }), 403, 'ACCOUNT_DISABLED');
    });
  });

  describe('POST /sponsorships', () => {
    it('pledges a pending sponsorship for my sponsor profile (201)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: SPONSORSHIPS,
        headers: auth('sponsor'),
        payload: { amount: 2500.5, campaign_id: C(1), sponsorship_type: ' financial ' },
      });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({ sponsor_id: ROLE_IDS.sponsor, campaign_id: C(1), amount: 2500.5, sponsorship_type: 'financial', status: 'pending' });
      expect(db.requestsTo('sponsorships', 'POST')[0]?.body).toEqual({
        sponsor_id: ROLE_IDS.sponsor,
        campaign_id: C(1),
        amount: 2500.5,
        sponsorship_type: 'financial',
        status: 'pending',
      });
    });

    it('forces pending and ignores status and sponsor_id from the client', async () => {
      const response = await app.inject({
        method: 'POST',
        url: SPONSORSHIPS,
        headers: auth('sponsor'),
        payload: { amount: 100, status: 'successful', sponsor_id: ROLE_IDS.sponsor2 },
      });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({ sponsor_id: ROLE_IDS.sponsor, status: 'pending', campaign_id: null, sponsorship_type: null });
      expect(db.requestsTo('campaigns')).toHaveLength(0);
    });

    it.each([C(2), C(3), MISSING])('returns 404 for a campaign that is not active (%s)', async (id) => {
      const response = await app.inject({ method: 'POST', url: SPONSORSHIPS, headers: auth('sponsor'), payload: { amount: 100, campaign_id: id } });
      expectErrorShape(response, 404, 'NOT_FOUND');
      expect(db.requestsTo('sponsorships', 'POST')).toHaveLength(0);
    });

    it.each([
      ['no amount', {}],
      ['amount 0', { amount: 0 }],
      ['a negative amount', { amount: -1 }],
      ['three decimals', { amount: 1.001 }],
      ['an amount too large', { amount: 10_000_000_000 }],
      ['an invalid campaign_id', { amount: 1, campaign_id: 'x' }],
    ])('returns 400 for %s', async (_name, payload) => {
      expectErrorShape(await app.inject({ method: 'POST', url: SPONSORSHIPS, headers: auth('sponsor'), payload }), 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });

    it('returns 403 when I have no sponsor profile', async () => {
      const seed = baseSeed();
      seed.sponsor_profiles = (seed.sponsor_profiles ?? []).filter((row) => row.user_id !== USERS.sponsor.id);
      db.reset(seed);
      expectErrorShape(await app.inject({ method: 'POST', url: SPONSORSHIPS, headers: auth('sponsor'), payload: { amount: 1 } }), 403, 'FORBIDDEN');
    });

    it('returns 503 when the database is unreachable', async () => {
      db.failNext('network', { target: 'sponsorships', method: 'POST' });
      expectErrorShape(await app.inject({ method: 'POST', url: SPONSORSHIPS, headers: auth('sponsor'), payload: { amount: 1 } }), 503, 'SERVICE_UNAVAILABLE');
    });
  });

  describe('GET /sponsorships (administrators)', () => {
    it('lists all sponsorships newest first with the campaign and sponsor', async () => {
      const response = await app.inject({ method: 'GET', url: SPONSORSHIPS, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([SP(3), SP(2), SP(1), SP(4)]);
      expect(body.meta).toEqual({ page: 1, pageSize: 20, total: 4, totalPages: 1 });
      expect(body.data[0]).toMatchObject({
        campaigns: { id: C(1), title: 'Campaign 1' },
        sponsor_profiles: { id: ROLE_IDS.sponsor2, organisation_name: 'Sara Trust', profiles: { email: USERS.sponsor2.email } },
      });
    });

    it('filters by status', async () => {
      const response = await app.inject({ method: 'GET', url: `${SPONSORSHIPS}?status=pending`, headers: auth('admin') });
      expect(response.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([SP(3), SP(1)]);
      expectErrorShape(await app.inject({ method: 'GET', url: `${SPONSORSHIPS}?status=open`, headers: auth('admin') }), 400, 'VALIDATION_ERROR');
    });
  });

  describe('GET /sponsorships/me', () => {
    it('lists only my sponsorships with the campaign (null when not active)', async () => {
      const response = await app.inject({ method: 'GET', url: `${SPONSORSHIPS}/me`, headers: auth('sponsor') });
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([SP(2), SP(1), SP(4)]);
      expect(body.data[1]?.campaigns).toMatchObject({ id: C(1), title: 'Campaign 1', status: 'active', funding_goal: 10000, amount_raised: 0 });
      expect(body.data[2]?.campaigns).toBeNull();
      expect(db.requestsTo('sponsorships', 'GET')[0]?.url.searchParams.get('sponsor_id')).toBe(`eq.${ROLE_IDS.sponsor}`);
    });

    it('filters by status and paginates', async () => {
      const filtered = await app.inject({ method: 'GET', url: `${SPONSORSHIPS}/me?status=failed`, headers: auth('sponsor') });
      expect(filtered.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([SP(4)]);
      const past = await app.inject({ method: 'GET', url: `${SPONSORSHIPS}/me?page=4&pageSize=1`, headers: auth('sponsor') });
      expect(past.json()).toEqual({ data: [], meta: { page: 4, pageSize: 1, total: 3, totalPages: 3 } });
    });
  });

  describe('GET /sponsorship-requests', () => {
    it('sponsors only see open requests, newest first, with the campaign', async () => {
      const response = await app.inject({ method: 'GET', url: `${REQUESTS}?status=open`, headers: auth('sponsor') });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([Q(2), Q(1)]);
      expect(body.data[1]?.campaigns).toEqual({ id: C(1), title: 'Campaign 1' });
      const unfiltered = await app.inject({ method: 'GET', url: REQUESTS, headers: auth('sponsor') });
      expect(unfiltered.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([Q(2), Q(1)]);
      const closed = await app.inject({ method: 'GET', url: `${REQUESTS}?status=closed`, headers: auth('sponsor') });
      expect(closed.json<{ data: Row[] }>().data).toEqual([]);
    });

    it('administrators see every request and can filter by status', async () => {
      const all = await app.inject({ method: 'GET', url: REQUESTS, headers: auth('admin') });
      expect(all.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([Q(2), Q(3), Q(1), Q(4)]);
      const closed = await app.inject({ method: 'GET', url: `${REQUESTS}?status=closed`, headers: auth('admin') });
      expect(closed.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([Q(3)]);
    });

    it('returns 400 for an unknown status', async () => {
      expectErrorShape(await app.inject({ method: 'GET', url: `${REQUESTS}?status=pending`, headers: auth('sponsor') }), 400, 'VALIDATION_ERROR');
    });
  });

  describe('POST /sponsorship-requests/:id/responses', () => {
    it("registers my interest in an open request (201, status 'interested')", async () => {
      const response = await app.inject({ method: 'POST', url: `${REQUESTS}/${Q(1)}/responses`, headers: auth('sponsor'), payload: { notes: ' We can help ', sponsorship_id: SP(1) } });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({ request_id: Q(1), sponsor_id: ROLE_IDS.sponsor, sponsorship_id: SP(1), status: 'interested', notes: 'We can help' });
      expect(db.requestsTo('sponsorship_request_responses', 'POST')[0]?.body).toEqual({
        request_id: Q(1),
        sponsor_id: ROLE_IDS.sponsor,
        sponsorship_id: SP(1),
        notes: 'We can help',
        status: 'interested',
      });
      const duplicateCheck = db.requestsTo('sponsorship_request_responses', 'GET')[0]?.url.searchParams;
      expect(duplicateCheck?.get('sponsor_id')).toBe(`eq.${ROLE_IDS.sponsor}`);
      expect(duplicateCheck?.get('request_id')).toBe(`eq.${Q(1)}`);
      expect(db.requestsTo('sponsorships', 'GET')[0]?.url.searchParams.get('sponsor_id')).toBe(`eq.${ROLE_IDS.sponsor}`);
    });

    it('accepts an empty body and ignores status and sponsor_id from the client', async () => {
      const empty = await app.inject({ method: 'POST', url: `${REQUESTS}/${Q(2)}/responses`, headers: auth('sponsor') });
      expect(empty.statusCode).toBe(201);
      expect(empty.json<{ data: Row }>().data).toMatchObject({ notes: null, sponsorship_id: null });
      const forged = await app.inject({
        method: 'POST',
        url: `${REQUESTS}/${Q(2)}/responses`,
        headers: auth('sponsor2'),
        payload: { status: 'accepted', sponsor_id: ROLE_IDS.sponsor, request_id: Q(1) },
      });
      expect(forged.json<{ data: Row }>().data).toMatchObject({ request_id: Q(2), sponsor_id: ROLE_IDS.sponsor2, status: 'interested' });
    });

    it('returns 409 when I already responded', async () => {
      const response = await app.inject({ method: 'POST', url: `${REQUESTS}/${Q(1)}/responses`, headers: auth('sponsor2'), payload: {} });
      expectErrorShape(response, 409, 'CONFLICT');
      expect(db.requestsTo('sponsorship_request_responses', 'POST')).toHaveLength(0);
    });

    it('returns the same 404 for a closed request and a missing one', async () => {
      const closed = await app.inject({ method: 'POST', url: `${REQUESTS}/${Q(3)}/responses`, headers: auth('sponsor'), payload: {} });
      const missing = await app.inject({ method: 'POST', url: `${REQUESTS}/${MISSING}/responses`, headers: auth('sponsor'), payload: {} });
      expectErrorShape(closed, 404, 'NOT_FOUND');
      expect(closed.body).toBe(missing.body);
    });

    it("returns 404 for someone else's sponsorship", async () => {
      const response = await app.inject({ method: 'POST', url: `${REQUESTS}/${Q(2)}/responses`, headers: auth('sponsor'), payload: { sponsorship_id: SP(3) } });
      expectErrorShape(response, 404, 'NOT_FOUND');
      expect(response.json<{ error: { message: string } }>().error.message).toBe('Sponsorship not found');
      expect(db.requestsTo('sponsorship_request_responses', 'POST')).toHaveLength(0);
    });

    it.each([
      ['an invalid id', `${REQUESTS}/nope/responses`, {}],
      ['an invalid sponsorship_id', `${REQUESTS}/${Q(1)}/responses`, { sponsorship_id: 'x' }],
      ['long notes', `${REQUESTS}/${Q(1)}/responses`, { notes: 'x'.repeat(1001) }],
    ])('returns 400 for %s', async (_name, url, payload) => {
      expectErrorShape(await app.inject({ method: 'POST', url, headers: auth('sponsor'), payload }), 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });
  });

  describe('PATCH /sponsorships/:id', () => {
    it('updates amount and status for an administrator', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `${SPONSORSHIPS}/${SP(1)}`,
        headers: auth('admin'),
        payload: { amount: 1800, status: 'successful' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row }>().data).toMatchObject({ id: SP(1), amount: 1800, status: 'successful', sponsor_id: ROLE_IDS.sponsor });
    });

    it('returns 404 for a missing sponsorship', async () => {
      expectErrorShape(
        await app.inject({ method: 'PATCH', url: `${SPONSORSHIPS}/${MISSING}`, headers: auth('admin'), payload: { status: 'cancelled' } }),
        404,
        'NOT_FOUND',
      );
    });
  });

  describe('POST /sponsorship-requests', () => {
    it('creates a request for the caller administrator profile and ignores created_by', async () => {
      const response = await app.inject({
        method: 'POST',
        url: REQUESTS,
        headers: auth('admin'),
        payload: { title: ' School transport ', requested_support: 'A minibus', created_by: USERS.admin.id, campaign_id: C(1) },
      });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({
        title: 'School transport',
        requested_support: 'A minibus',
        created_by: ROLE_IDS.admin,
        campaign_id: C(1),
        status: 'open',
        priority: 'normal',
      });
    });
  });

  describe('PATCH /sponsorship-requests/:id', () => {
    it('updates a request without changing created_by', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `${REQUESTS}/${Q(1)}`,
        headers: auth('admin'),
        payload: { status: 'closed', title: 'Updated request' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row }>().data).toMatchObject({ id: Q(1), status: 'closed', title: 'Updated request', created_by: ROLE_IDS.admin });
    });
  });

  describe('GET /sponsorship-request-responses/me', () => {
    it('lists only my responses', async () => {
      const mine = await app.inject({ method: 'GET', url: `${V1}/sponsorship-request-responses/me`, headers: auth('sponsor2') });
      expect(mine.statusCode).toBe(200);
      expect(mine.json<{ data: Row[] }>().data).toMatchObject([{ id: RS(1), request_id: Q(1), notes: 'Keen' }]);
      const empty = await app.inject({ method: 'GET', url: `${V1}/sponsorship-request-responses/me`, headers: auth('sponsor') });
      expect(empty.json<{ data: Row[]; meta: { total: number } }>().meta.total).toBe(0);
    });
  });

  describe('OpenAPI docs', () => {
    it('documents the sponsorship endpoints', async () => {
      const spec = (await app.inject({ method: 'GET', url: '/docs/json' })).json<{ paths: Record<string, Record<string, { tags?: string[]; security?: unknown; responses: Record<string, unknown> }>> }>();
      const operations = [
        spec.paths['/api/v1/sponsorships']?.['post'],
        spec.paths['/api/v1/sponsorships']?.['get'],
        spec.paths['/api/v1/sponsorships/me']?.['get'],
        spec.paths['/api/v1/sponsorship-requests']?.['get'],
        spec.paths['/api/v1/sponsorship-requests/{id}/responses']?.['post'],
      ];
      for (const operation of operations) {
        expect(operation?.tags).toEqual(['sponsorships']);
        expect(operation?.security).toEqual([{ bearerAuth: [] }]);
        expect(Object.keys(operation?.responses ?? {})).toEqual(expect.arrayContaining(['400', '401', '403', '500', '503']));
      }
      expect(Object.keys(operations[4]?.responses ?? {})).toEqual(expect.arrayContaining(['201', '404', '409']));
      expect(spec.paths['/api/v1/sponsorships/{id}']?.['patch']?.tags).toEqual(['sponsorships']);
      expect(spec.paths['/api/v1/sponsorship-requests']?.['post']?.tags).toEqual(['sponsorships']);
      expect(spec.paths['/api/v1/sponsorship-requests/{id}']?.['patch']?.tags).toEqual(['sponsorships']);
      expect(spec.paths['/api/v1/sponsorship-request-responses/me']?.['get']?.tags).toEqual(['sponsorships']);
    });
  });
});
