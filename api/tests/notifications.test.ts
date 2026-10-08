import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FakeSupabase, expectErrorShape, type Row } from './helpers/fakeSupabase.js';
import { ACCOUNTS, USERS, auth, seedWith } from './helpers/fixtures.js';

// /api/v1/notifications against the real supabase-js client and the in-memory PostgREST/RLS emulation.
const BASE = '/api/v1/notifications';
const db = new FakeSupabase(ACCOUNTS);

const N = (n: number) => `c1c1c1c1-0000-4000-8000-${n.toString().padStart(12, '0')}`;

function notification(n: number, userId: string, status: string, date: string): Row {
  return {
    id: N(n),
    user_id: userId,
    title: `Title ${n}`,
    message: `Message ${n}`,
    notification_type: 'donation',
    status,
    link_url: '/donor/dashboard/donation-history',
    related_entity_type: 'donation',
    related_entity_id: null,
    notification_date: date,
  };
}

describe('notifications API', () => {
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
        notifications: [
          notification(1, USERS.donor.id, 'unread', '2026-10-01T08:00:00+00:00'),
          notification(2, USERS.donor.id, 'read', '2026-10-02T08:00:00+00:00'),
          notification(3, USERS.donor.id, 'unread', '2026-10-03T08:00:00+00:00'),
          notification(4, USERS.donor2.id, 'unread', '2026-10-04T08:00:00+00:00'),
          notification(5, USERS.admin.id, 'unread', '2026-10-05T08:00:00+00:00'),
        ],
      }),
    );
  });

  describe('authentication', () => {
    it.each([
      ['GET', BASE],
      ['PATCH', `${BASE}/${N(1)}/read`],
      ['POST', `${BASE}/read-all`],
    ] as const)('%s %s without a token returns 401', async (method, url) => {
      const response = await app.inject({ method, url });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(db.requests).toHaveLength(0);
    });

    it('rejects a suspended account with 403 ACCOUNT_DISABLED', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth('suspended') });
      expectErrorShape(response, 403, 'ACCOUNT_DISABLED');
    });
  });

  describe('GET /notifications', () => {
    it('lists only my notifications, newest first, with unreadCount', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth('donor') });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([N(3), N(2), N(1)]);
      expect(body.meta).toEqual({ page: 1, pageSize: 20, total: 3, totalPages: 1, unreadCount: 2 });
      const query = db.requestsTo('notifications', 'GET')[0]?.url.searchParams;
      expect(query?.get('user_id')).toBe(`eq.${USERS.donor.id}`);
      expect(query?.get('order')).toBe('notification_date.desc,id.desc');
    });

    it('filters by status=unread', async () => {
      const response = await app.inject({ method: 'GET', url: `${BASE}?status=unread`, headers: auth('donor') });
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([N(3), N(1)]);
      expect(body.meta).toMatchObject({ total: 2, unreadCount: 2 });
    });

    it('filters by status=read and still reports all unread', async () => {
      const response = await app.inject({ method: 'GET', url: `${BASE}?status=read`, headers: auth('donor') });
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([N(2)]);
      expect(body.meta).toMatchObject({ total: 1, unreadCount: 2 });
    });

    it('an administrator only sees their own notifications (RLS would show all)', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth('admin') });
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([N(5)]);
      expect(body.meta).toMatchObject({ total: 1, unreadCount: 1 });
    });

    it('paginates and returns an empty page with the real total past the end', async () => {
      const page2 = await app.inject({ method: 'GET', url: `${BASE}?page=2&pageSize=2`, headers: auth('donor') });
      expect(page2.json<{ data: Row[]; meta: Row }>()).toMatchObject({ data: [{ id: N(1) }], meta: { page: 2, pageSize: 2, total: 3, totalPages: 2 } });
      const past = await app.inject({ method: 'GET', url: `${BASE}?page=9&pageSize=2`, headers: auth('donor') });
      expect(past.json()).toEqual({ data: [], meta: { page: 9, pageSize: 2, total: 3, totalPages: 2, unreadCount: 2 } });
    });

    it.each(['status=archived', 'page=0', 'pageSize=500'])('returns 400 for %s', async (query) => {
      const response = await app.inject({ method: 'GET', url: `${BASE}?${query}`, headers: auth('donor') });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });

    it('ignores a user_id in the query string (still only my notifications)', async () => {
      const response = await app.inject({ method: 'GET', url: `${BASE}?user_id=${USERS.donor2.id}`, headers: auth('donor') });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row[] }>().data.every((row) => row.user_id === USERS.donor.id)).toBe(true);
      expect(db.requestsTo('notifications', 'GET')[0]?.url.searchParams.getAll('user_id')).toEqual([`eq.${USERS.donor.id}`]);
    });

    it('returns 503 when the database is unreachable', async () => {
      db.failNext('network');
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth('donor') });
      expectErrorShape(response, 503, 'SERVICE_UNAVAILABLE');
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('marks my notification as read', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${BASE}/${N(1)}/read`, headers: auth('donor') });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row }>().data).toMatchObject({ id: N(1), status: 'read', user_id: USERS.donor.id });
      const patch = db.requestsTo('notifications', 'PATCH')[0];
      expect(patch?.body).toEqual({ status: 'read' });
      expect(patch?.url.searchParams.get('user_id')).toBe(`eq.${USERS.donor.id}`);
    });

    it('is idempotent for an already read notification', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${BASE}/${N(2)}/read`, headers: auth('donor') });
      expect(response.statusCode).toBe(200);
    });

    it("returns 404 for someone else's notification and leaves it unread", async () => {
      const other = await app.inject({ method: 'PATCH', url: `${BASE}/${N(4)}/read`, headers: auth('donor') });
      const missing = await app.inject({ method: 'PATCH', url: `${BASE}/${N(99)}/read`, headers: auth('donor') });
      expectErrorShape(other, 404, 'NOT_FOUND');
      expect(other.body).toBe(missing.body);
      expect(db.find('notifications', (row) => row.id === N(4))?.status).toBe('unread');
    });

    it("an administrator cannot mark another user's notification as read", async () => {
      const response = await app.inject({ method: 'PATCH', url: `${BASE}/${N(1)}/read`, headers: auth('admin') });
      expectErrorShape(response, 404, 'NOT_FOUND');
      expect(db.find('notifications', (row) => row.id === N(1))?.status).toBe('unread');
    });

    it('returns 400 for an invalid id', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${BASE}/not-a-uuid/read`, headers: auth('donor') });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });
  });

  describe('POST /notifications/read-all', () => {
    it('marks all my unread notifications as read and reports how many changed', async () => {
      const response = await app.inject({ method: 'POST', url: `${BASE}/read-all`, headers: auth('donor') });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ data: { updated: 2 } });
      expect(db.rows('notifications').filter((row) => row.user_id === USERS.donor.id).map((row) => row.status)).toEqual(['read', 'read', 'read']);
      expect(db.find('notifications', (row) => row.id === N(4))?.status).toBe('unread');
      const patch = db.requestsTo('notifications', 'PATCH')[0];
      expect(patch?.body).toEqual({ status: 'read' });
      expect(patch?.url.searchParams.get('user_id')).toBe(`eq.${USERS.donor.id}`);
      expect(patch?.url.searchParams.get('status')).toBe('eq.unread');
    });

    it('an administrator only marks their own', async () => {
      const response = await app.inject({ method: 'POST', url: `${BASE}/read-all`, headers: auth('admin') });
      expect(response.json()).toEqual({ data: { updated: 1 } });
      expect(db.rows('notifications').filter((row) => row.status === 'unread')).toHaveLength(3);
    });

    it('returns updated 0 when nothing is unread', async () => {
      const response = await app.inject({ method: 'POST', url: `${BASE}/read-all`, headers: auth('volunteer') });
      expect(response.json()).toEqual({ data: { updated: 0 } });
    });

    it('does not expose raw database errors', async () => {
      db.failNext({ status: 400, body: { code: '42703', message: 'column notifications.secret does not exist', details: null, hint: null } });
      const response = await app.inject({ method: 'POST', url: `${BASE}/read-all`, headers: auth('donor') });
      expectErrorShape(response, 500, 'INTERNAL_ERROR');
      expect(response.body).not.toMatch(/secret|42703/);
    });
  });

  describe('OpenAPI docs', () => {
    it('documents the notification endpoints', async () => {
      const spec = (await app.inject({ method: 'GET', url: '/docs/json' })).json<{ paths: Record<string, Record<string, { tags?: string[]; security?: unknown; responses: Record<string, unknown> }>> }>();
      const list = (spec.paths['/api/v1/notifications/'] ?? spec.paths['/api/v1/notifications'])?.['get'];
      const read = spec.paths['/api/v1/notifications/{id}/read']?.['patch'];
      const readAll = spec.paths['/api/v1/notifications/read-all']?.['post'];
      for (const operation of [list, read, readAll]) {
        expect(operation?.tags).toEqual(['notifications']);
        expect(operation?.security).toEqual([{ bearerAuth: [] }]);
        expect(Object.keys(operation?.responses ?? {})).toEqual(expect.arrayContaining(['200', '401', '403', '500', '503']));
      }
      expect(Object.keys(read?.responses ?? {})).toContain('404');
    });
  });
});
