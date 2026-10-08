import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FakeSupabase, expectErrorShape, type Row } from './helpers/fakeSupabase.js';
import { ACCOUNTS, ROLE_IDS, USERS, auth, baseSeed, seedWith } from './helpers/fixtures.js';

// Assistance requests, supporting documents and collection schedules against the real supabase-js
// client and the in-memory PostgREST/RLS emulation.
const V1 = '/api/v1';
const REQUESTS = `${V1}/assistance-requests`;
const ADMIN_REQUESTS = `${V1}/admin/assistance-requests`;
const ADMIN_SCHEDULES = `${V1}/admin/collection-schedules`;
const MY_SCHEDULES = `${V1}/collection-schedules/me`;
const db = new FakeSupabase(ACCOUNTS);

const R = (n: number) => `ae000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const DOC = (n: number) => `d0c00000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const S = (n: number) => `5c000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const MISSING = '99999999-9999-4999-8999-999999999999';

function request(n: number, beneficiaryId: string, status: string, date: string): Row {
  return {
    id: R(n),
    beneficiary_id: beneficiaryId,
    request_date: date,
    request_type: 'Food Support',
    description: `Request number ${n} for food`,
    status,
    priority: 'normal',
  };
}

function schedule(n: number, requestId: string | null, date: string, status = 'upcoming'): Row {
  return { id: S(n), request_id: requestId, location: 'Hall', collection_date: date, status, created_at: '2026-10-01T00:00:00+00:00' };
}

const VALID = { request_type: ' Food Support ', description: '  We need food parcels for four people.  ', priority: 'high', preferred_collection_area: ' Soweto ' };
const validDocument = () => ({ document_name: ' ID copy ', document_type: 'application/pdf', file_path: `${USERS.beneficiary.id}/${R(1)}/id.pdf` });

describe('assistance API', () => {
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
        assistance_requests: [
          request(1, ROLE_IDS.beneficiary, 'pending', '2026-10-01T08:00:00+00:00'),
          request(2, ROLE_IDS.beneficiary, 'under_review', '2026-10-02T08:00:00+00:00'),
          request(3, ROLE_IDS.beneficiary, 'approved', '2026-10-03T08:00:00+00:00'),
          request(4, ROLE_IDS.beneficiary, 'rejected', '2026-10-04T08:00:00+00:00'),
          request(5, ROLE_IDS.beneficiary2, 'pending', '2026-10-05T08:00:00+00:00'),
          request(6, ROLE_IDS.beneficiary, 'completed', '2026-10-06T08:00:00+00:00'),
        ],
        supporting_documents: [
          { id: DOC(1), request_id: R(1), document_name: 'Payslip', file_path: `${USERS.beneficiary.id}/payslip.pdf`, upload_date: '2026-10-01T09:00:00+00:00' },
          { id: DOC(2), request_id: R(5), document_name: 'ID', file_path: `${USERS.beneficiary2.id}/id.pdf`, upload_date: '2026-10-05T09:00:00+00:00' },
        ],
        collection_schedules: [
          schedule(1, R(3), '2026-10-20'),
          schedule(2, R(5), '2026-10-15'),
          schedule(3, null, '2026-10-10'),
          schedule(4, R(3), '2026-10-12', 'confirmed'),
        ],
      }),
    );
  });

  describe('authentication and roles', () => {
    it.each([
      ['POST', REQUESTS],
      ['GET', REQUESTS],
      ['GET', `${REQUESTS}/me`],
      ['GET', `${REQUESTS}/${R(1)}`],
      ['POST', `${REQUESTS}/${R(1)}/documents`],
      ['PATCH', `${ADMIN_REQUESTS}/${R(1)}`],
      ['POST', ADMIN_SCHEDULES],
      ['GET', ADMIN_SCHEDULES],
      ['GET', MY_SCHEDULES],
    ] as const)('%s %s without a token returns 401', async (method, url) => {
      const response = await app.inject({ method, url });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(db.requests).toHaveLength(0);
    });

    it.each([
      ['donor', 'POST', REQUESTS],
      ['admin', 'POST', REQUESTS],
      ['beneficiary', 'GET', REQUESTS],
      ['admin', 'GET', `${REQUESTS}/me`],
      ['volunteer', 'POST', `${REQUESTS}/${R(1)}/documents`],
      ['beneficiary', 'PATCH', `${ADMIN_REQUESTS}/${R(1)}`],
      ['beneficiary', 'POST', ADMIN_SCHEDULES],
      ['sponsor', 'GET', ADMIN_SCHEDULES],
      ['donor', 'GET', MY_SCHEDULES],
    ] as const)('%s cannot %s %s (403)', async (user, method, url) => {
      const response = await app.inject({ method, url, headers: auth(user), payload: method === 'GET' ? undefined : {} });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(db.requests).toHaveLength(0);
    });

    it('rejects a suspended account with 403 ACCOUNT_DISABLED', async () => {
      const response = await app.inject({ method: 'GET', url: `${REQUESTS}/${R(1)}`, headers: auth('suspended') });
      expectErrorShape(response, 403, 'ACCOUNT_DISABLED');
    });
  });

  describe('POST /assistance-requests', () => {
    it('creates a pending request for my beneficiary profile (201)', async () => {
      const response = await app.inject({ method: 'POST', url: REQUESTS, headers: auth('beneficiary'), payload: VALID });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({
        beneficiary_id: ROLE_IDS.beneficiary,
        request_type: 'Food Support',
        description: 'We need food parcels for four people.',
        status: 'pending',
        priority: 'high',
        preferred_collection_area: 'Soweto',
        admin_notes: null,
        reviewed_by: null,
        reviewed_at: null,
      });
      expect(db.requestsTo('assistance_requests', 'POST')[0]?.body).toEqual({
        beneficiary_id: ROLE_IDS.beneficiary,
        request_type: 'Food Support',
        description: 'We need food parcels for four people.',
        preferred_collection_area: 'Soweto',
        status: 'pending',
        priority: 'high',
      });
    });

    it('ignores status, beneficiary_id and review fields from the client; priority defaults to normal', async () => {
      const response = await app.inject({
        method: 'POST',
        url: REQUESTS,
        headers: auth('beneficiary'),
        payload: {
          request_type: 'Rent',
          description: 'Help with rent this month please',
          status: 'approved',
          beneficiary_id: ROLE_IDS.beneficiary2,
          admin_notes: 'approve me',
          reviewed_by: ROLE_IDS.admin,
        },
      });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({
        beneficiary_id: ROLE_IDS.beneficiary,
        status: 'pending',
        priority: 'normal',
        admin_notes: null,
        reviewed_by: null,
      });
    });

    it.each([
      ['a short description', { request_type: 'Food', description: 'too short' }],
      ['a long description', { request_type: 'Food', description: 'x'.repeat(1001) }],
      ['a blank request_type', { request_type: '   ', description: 'A long enough description' }],
      ['no request_type', { description: 'A long enough description' }],
      ['an unknown priority', { request_type: 'Food', description: 'A long enough description', priority: 'extreme' }],
    ])('returns 400 for %s', async (_name, payload) => {
      const response = await app.inject({ method: 'POST', url: REQUESTS, headers: auth('beneficiary'), payload });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });

    it('returns 403 when I have no beneficiary profile', async () => {
      const seed = baseSeed();
      seed.beneficiary_profiles = (seed.beneficiary_profiles ?? []).filter((row) => row.user_id !== USERS.beneficiary.id);
      db.reset(seed);
      const response = await app.inject({ method: 'POST', url: REQUESTS, headers: auth('beneficiary'), payload: VALID });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(db.rows('assistance_requests')).toHaveLength(0);
    });

    it('returns 503 when the database is unreachable', async () => {
      db.failNext('network', { target: 'assistance_requests', method: 'POST' });
      const response = await app.inject({ method: 'POST', url: REQUESTS, headers: auth('beneficiary'), payload: VALID });
      expectErrorShape(response, 503, 'SERVICE_UNAVAILABLE');
    });
  });

  describe('GET /assistance-requests (administrators)', () => {
    it('lists all requests newest first with the beneficiary', async () => {
      const response = await app.inject({ method: 'GET', url: REQUESTS, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([R(6), R(5), R(4), R(3), R(2), R(1)]);
      expect(body.meta).toEqual({ page: 1, pageSize: 20, total: 6, totalPages: 1 });
      expect(body.data.find((row) => row.id === R(5))?.beneficiary_profiles).toEqual({
        id: ROLE_IDS.beneficiary2,
        user_id: USERS.beneficiary2.id,
        profiles: { full_name: 'Bheki Beneficiary', email: USERS.beneficiary2.email },
      });
    });

    it('filters by status and paginates', async () => {
      const pending = await app.inject({ method: 'GET', url: `${REQUESTS}?status=pending`, headers: auth('admin') });
      expect(pending.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([R(5), R(1)]);
      const past = await app.inject({ method: 'GET', url: `${REQUESTS}?page=3&pageSize=5`, headers: auth('admin') });
      expect(past.json()).toEqual({ data: [], meta: { page: 3, pageSize: 5, total: 6, totalPages: 2 } });
    });

    it('returns 400 for an unknown status', async () => {
      expectErrorShape(await app.inject({ method: 'GET', url: `${REQUESTS}?status=open`, headers: auth('admin') }), 400, 'VALIDATION_ERROR');
    });
  });

  describe('GET /assistance-requests/me', () => {
    it('lists only my requests with their documents and schedules', async () => {
      const response = await app.inject({ method: 'GET', url: `${REQUESTS}/me`, headers: auth('beneficiary') });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([R(6), R(4), R(3), R(2), R(1)]);
      expect(body.meta).toMatchObject({ total: 5 });
      expect(body.data.find((row) => row.id === R(1))?.supporting_documents).toMatchObject([{ id: DOC(1), verification_status: 'pending' }]);
      expect((body.data.find((row) => row.id === R(3))?.collection_schedules as Row[]).map((row) => row.id).sort()).toEqual([S(1), S(4)]);
      expect(db.requestsTo('assistance_requests', 'GET')[0]?.url.searchParams.get('beneficiary_id')).toBe(`eq.${ROLE_IDS.beneficiary}`);
    });

    it('filters by status; another beneficiary only sees their own', async () => {
      const mine = await app.inject({ method: 'GET', url: `${REQUESTS}/me?status=approved`, headers: auth('beneficiary') });
      expect(mine.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([R(3)]);
      const other = await app.inject({ method: 'GET', url: `${REQUESTS}/me`, headers: auth('beneficiary2') });
      expect(other.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([R(5)]);
    });
  });

  describe('GET /assistance-requests/:id', () => {
    it('returns my request with documents, schedules and my beneficiary profile', async () => {
      const response = await app.inject({ method: 'GET', url: `${REQUESTS}/${R(3)}`, headers: auth('beneficiary') });
      expect(response.statusCode).toBe(200);
      const data = response.json<{ data: Row }>().data;
      expect(data).toMatchObject({ id: R(3), status: 'approved', beneficiary_profiles: { id: ROLE_IDS.beneficiary } });
      expect(data.collection_schedules).toHaveLength(2);
    });

    it('an administrator can read any request', async () => {
      const response = await app.inject({ method: 'GET', url: `${REQUESTS}/${R(5)}`, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row }>().data).toMatchObject({
        id: R(5),
        supporting_documents: [{ id: DOC(2) }],
        beneficiary_profiles: { profiles: { full_name: 'Bheki Beneficiary' } },
      });
    });

    it.each(['beneficiary2', 'donor'] as const)("returns the same 404 to %s for someone else's request as for a missing one", async (user) => {
      const other = await app.inject({ method: 'GET', url: `${REQUESTS}/${R(1)}`, headers: auth(user) });
      const missing = await app.inject({ method: 'GET', url: `${REQUESTS}/${MISSING}`, headers: auth(user) });
      expectErrorShape(other, 404, 'NOT_FOUND');
      expect(other.body).toBe(missing.body);
    });

    it('returns 400 for an invalid id', async () => {
      expectErrorShape(await app.inject({ method: 'GET', url: `${REQUESTS}/nope`, headers: auth('beneficiary') }), 400, 'VALIDATION_ERROR');
    });
  });

  describe('POST /assistance-requests/:id/documents', () => {
    it('attaches a pending document to my request (201)', async () => {
      const response = await app.inject({ method: 'POST', url: `${REQUESTS}/${R(1)}/documents`, headers: auth('beneficiary'), payload: validDocument() });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({
        request_id: R(1),
        document_name: 'ID copy',
        document_type: 'application/pdf',
        file_path: `${USERS.beneficiary.id}/${R(1)}/id.pdf`,
        verification_status: 'pending',
      });
      expect(db.requestsTo('supporting_documents', 'POST')[0]?.body).toEqual({
        request_id: R(1),
        document_name: 'ID copy',
        document_type: 'application/pdf',
        file_path: `${USERS.beneficiary.id}/${R(1)}/id.pdf`,
        verification_status: 'pending',
      });
      expect(db.requestsTo('assistance_requests', 'GET')[0]?.url.searchParams.get('beneficiary_id')).toBe(`eq.${ROLE_IDS.beneficiary}`);
    });

    it('ignores verification_status and request_id from the client', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${REQUESTS}/${R(2)}/documents`,
        headers: auth('beneficiary'),
        payload: { ...validDocument(), verification_status: 'approved', request_id: R(5) },
      });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({ request_id: R(2), verification_status: 'pending' });
    });

    it.each([R(4), R(6)])('returns 409 for a rejected or completed request (%s)', async (id) => {
      const response = await app.inject({ method: 'POST', url: `${REQUESTS}/${id}/documents`, headers: auth('beneficiary'), payload: validDocument() });
      expectErrorShape(response, 409, 'CONFLICT');
      expect(db.requestsTo('supporting_documents', 'POST')).toHaveLength(0);
    });

    it("returns the same 404 for someone else's request and a missing one", async () => {
      const other = await app.inject({ method: 'POST', url: `${REQUESTS}/${R(5)}/documents`, headers: auth('beneficiary'), payload: validDocument() });
      const missing = await app.inject({ method: 'POST', url: `${REQUESTS}/${MISSING}/documents`, headers: auth('beneficiary'), payload: validDocument() });
      expectErrorShape(other, 404, 'NOT_FOUND');
      expect(other.body).toBe(missing.body);
    });

    it.each([
      ["someone else's folder", { document_name: 'ID', file_path: `${USERS.beneficiary2.id}/id.pdf` }],
      ['path traversal', { document_name: 'ID', file_path: `${USERS.beneficiary.id}/../x.pdf` }],
      ['no document_name', { file_path: `${USERS.beneficiary.id}/id.pdf` }],
      ['a blank document_name', { document_name: '  ', file_path: `${USERS.beneficiary.id}/id.pdf` }],
    ])('returns 400 for %s without touching the database', async (_name, payload) => {
      const response = await app.inject({ method: 'POST', url: `${REQUESTS}/${R(1)}/documents`, headers: auth('beneficiary'), payload });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });
  });

  describe('PATCH /admin/assistance-requests/:id', () => {
    it.each([
      [1, 'under_review'],
      [1, 'approved'],
      [1, 'rejected'],
      [2, 'approved'],
      [2, 'rejected'],
      [3, 'completed'],
    ])('moves request %i to %s, records the reviewer and the database notifies the beneficiary', async (n, status) => {
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_REQUESTS}/${R(n)}`, headers: auth('admin'), payload: { status } });
      expect(response.statusCode).toBe(200);
      const data = response.json<{ data: Row }>().data;
      expect(data).toMatchObject({ id: R(n), status, reviewed_by: ROLE_IDS.admin });
      expect(Number.isNaN(Date.parse(String(data.reviewed_at)))).toBe(false);
      expect(db.find('assistance_requests', (row) => row.id === R(n))?.status).toBe(status);
      const patch = db.requestsTo('assistance_requests', 'PATCH')[0];
      expect(Object.keys(patch?.body as Row).sort()).toEqual(['reviewed_at', 'reviewed_by', 'status']);
      expect(patch?.url.searchParams.get('status')).toMatch(/^eq\./);
      expect(db.rows('notifications')).toMatchObject([{ user_id: USERS.beneficiary.id, related_entity_id: R(n) }]);
    });

    it('saves trimmed admin notes', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `${ADMIN_REQUESTS}/${R(1)}`,
        headers: auth('admin2'),
        payload: { status: 'rejected', admin_notes: '  Missing documents  ', reviewed_by: ROLE_IDS.admin, beneficiary_id: ROLE_IDS.beneficiary2 },
      });
      expect(response.json<{ data: Row }>().data).toMatchObject({ admin_notes: 'Missing documents', reviewed_by: ROLE_IDS.admin2, beneficiary_id: ROLE_IDS.beneficiary });
    });

    it.each([
      [1, 'completed'],
      [2, 'under_review'],
      [3, 'approved'],
      [3, 'rejected'],
      [4, 'approved'],
      [6, 'approved'],
    ])('returns 409 for request %i -> %s and changes nothing', async (n, status) => {
      const before = db.find('assistance_requests', (row) => row.id === R(n))?.status;
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_REQUESTS}/${R(n)}`, headers: auth('admin'), payload: { status } });
      expectErrorShape(response, 409, 'CONFLICT');
      expect(db.requestsTo('assistance_requests', 'PATCH')).toHaveLength(0);
      expect(db.find('assistance_requests', (row) => row.id === R(n))?.status).toBe(before);
    });

    it.each([
      ['pending', { status: 'pending' }],
      ['no status', { admin_notes: 'x' }],
      ['unknown status', { status: 'closed' }],
    ])('returns 400 for %s', async (_name, payload) => {
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_REQUESTS}/${R(1)}`, headers: auth('admin'), payload });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });

    it('returns 404 for a missing request', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_REQUESTS}/${MISSING}`, headers: auth('admin'), payload: { status: 'approved' } });
      expectErrorShape(response, 404, 'NOT_FOUND');
    });
  });

  describe('POST /admin/collection-schedules', () => {
    it('schedules a collection for an approved request (201)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: ADMIN_SCHEDULES,
        headers: auth('admin'),
        payload: { request_id: R(3), programme_name: ' Food parcels ', location: ' Community hall ', collection_date: '2026-11-02', collection_time: '09:00 - 12:00', id: MISSING },
      });
      expect(response.statusCode).toBe(201);
      const data = response.json<{ data: Row }>().data;
      expect(data).toMatchObject({ request_id: R(3), programme_name: 'Food parcels', location: 'Community hall', collection_date: '2026-11-02', collection_time: '09:00 - 12:00', status: 'upcoming' });
      expect(data.id).not.toBe(MISSING);
      expect(db.requestsTo('collection_schedules', 'POST')[0]?.body).toEqual({
        request_id: R(3),
        programme_name: 'Food parcels',
        location: 'Community hall',
        collection_date: '2026-11-02',
        collection_time: '09:00 - 12:00',
        status: 'upcoming',
      });
    });

    it('schedules a general collection without a request', async () => {
      const response = await app.inject({ method: 'POST', url: ADMIN_SCHEDULES, headers: auth('admin'), payload: { location: 'Hall', collection_date: '2026-11-02', status: 'confirmed' } });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({ request_id: null, status: 'confirmed' });
      expect(db.requestsTo('assistance_requests')).toHaveLength(0);
    });

    it('returns 409 for a request that is not approved and 404 for a missing one', async () => {
      const pending = await app.inject({ method: 'POST', url: ADMIN_SCHEDULES, headers: auth('admin'), payload: { request_id: R(1), location: 'Hall', collection_date: '2026-11-02' } });
      expectErrorShape(pending, 409, 'CONFLICT');
      const missing = await app.inject({ method: 'POST', url: ADMIN_SCHEDULES, headers: auth('admin'), payload: { request_id: MISSING, location: 'Hall', collection_date: '2026-11-02' } });
      expectErrorShape(missing, 404, 'NOT_FOUND');
      expect(db.requestsTo('collection_schedules', 'POST')).toHaveLength(0);
    });

    it.each([
      ['no location', { collection_date: '2026-11-02' }],
      ['a bad date', { location: 'Hall', collection_date: '02/11/2026' }],
      ['an unknown status', { location: 'Hall', collection_date: '2026-11-02', status: 'cancelled' }],
    ])('returns 400 for %s', async (_name, payload) => {
      const response = await app.inject({ method: 'POST', url: ADMIN_SCHEDULES, headers: auth('admin'), payload });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });
  });

  describe('GET /admin/collection-schedules', () => {
    it('lists all schedules earliest first with the request', async () => {
      const response = await app.inject({ method: 'GET', url: ADMIN_SCHEDULES, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([S(3), S(4), S(2), S(1)]);
      expect(body.data[0]?.assistance_requests).toBeNull();
      expect(body.data[1]?.assistance_requests).toEqual({ id: R(3), beneficiary_id: ROLE_IDS.beneficiary, request_type: 'Food Support', status: 'approved' });
    });

    it('filters by status and request', async () => {
      const confirmed = await app.inject({ method: 'GET', url: `${ADMIN_SCHEDULES}?status=confirmed`, headers: auth('admin') });
      expect(confirmed.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([S(4)]);
      const forRequest = await app.inject({ method: 'GET', url: `${ADMIN_SCHEDULES}?request_id=${R(3)}`, headers: auth('admin') });
      expect(forRequest.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([S(4), S(1)]);
    });

    it('returns 400 for an invalid request_id', async () => {
      expectErrorShape(await app.inject({ method: 'GET', url: `${ADMIN_SCHEDULES}?request_id=x`, headers: auth('admin') }), 400, 'VALIDATION_ERROR');
    });
  });

  describe('GET /collection-schedules/me', () => {
    it('lists the schedules of my requests only, earliest first', async () => {
      const response = await app.inject({ method: 'GET', url: MY_SCHEDULES, headers: auth('beneficiary') });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ data: [{ id: S(4) }, { id: S(1) }], meta: { total: 2 } });
      expect(db.requestsTo('collection_schedules', 'GET')[0]?.url.searchParams.get('request_id')).toMatch(/^in\.\(/);
      expect(db.requestsTo('assistance_requests', 'GET')[0]?.url.searchParams.get('beneficiary_id')).toBe(`eq.${ROLE_IDS.beneficiary}`);
    });

    it('filters by status', async () => {
      const response = await app.inject({ method: 'GET', url: `${MY_SCHEDULES}?status=upcoming`, headers: auth('beneficiary') });
      expect(response.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([S(1)]);
    });

    it('returns an empty page without querying schedules when I have no requests', async () => {
      db.reset(baseSeed());
      const response = await app.inject({ method: 'GET', url: MY_SCHEDULES, headers: auth('beneficiary') });
      expect(response.json()).toEqual({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 } });
      expect(db.requestsTo('collection_schedules')).toHaveLength(0);
    });
  });

  describe('OpenAPI docs', () => {
    it('documents the assistance endpoints', async () => {
      const spec = (await app.inject({ method: 'GET', url: '/docs/json' })).json<{ paths: Record<string, Record<string, { tags?: string[]; security?: unknown; responses: Record<string, unknown> }>> }>();
      const operations = [
        spec.paths['/api/v1/assistance-requests']?.['post'],
        spec.paths['/api/v1/assistance-requests']?.['get'],
        spec.paths['/api/v1/assistance-requests/me']?.['get'],
        spec.paths['/api/v1/assistance-requests/{id}']?.['get'],
        spec.paths['/api/v1/assistance-requests/{id}/documents']?.['post'],
        spec.paths['/api/v1/admin/assistance-requests/{id}']?.['patch'],
        spec.paths['/api/v1/admin/collection-schedules']?.['post'],
        spec.paths['/api/v1/admin/collection-schedules']?.['get'],
        spec.paths['/api/v1/collection-schedules/me']?.['get'],
      ];
      for (const operation of operations) {
        expect(operation?.tags).toEqual(['assistance']);
        expect(operation?.security).toEqual([{ bearerAuth: [] }]);
        expect(Object.keys(operation?.responses ?? {})).toEqual(expect.arrayContaining(['400', '401', '403', '500', '503']));
      }
      expect(Object.keys(operations[5]?.responses ?? {})).toEqual(expect.arrayContaining(['200', '404', '409']));
    });
  });
});
