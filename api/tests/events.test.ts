import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FakeSupabase, expectErrorShape, type Row } from './helpers/fakeSupabase.js';
import { ACCOUNTS, ROLE_IDS, auth, seedWith } from './helpers/fixtures.js';

const BASE = '/api/v1/events';
const db = new FakeSupabase(ACCOUNTS);

const E = (n: number) => `e1000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const MISSING = '99999999-9999-4999-8999-999999999999';

function event(n: number, status: string, eventDate: string): Row {
  return {
    id: E(n),
    admin_id: ROLE_IDS.admin,
    title: `Event ${n}`,
    location: 'Soweto',
    event_date: eventDate,
    status,
  };
}

describe('events API', () => {
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
        events: [
          event(1, 'draft', '2026-12-01T09:00:00.000Z'),
          event(2, 'scheduled', '2026-11-01T09:00:00.000Z'),
        ],
      }),
    );
  });

  describe('authentication and roles', () => {
    it.each([
      ['GET', BASE],
      ['POST', BASE],
      ['PATCH', `${BASE}/${E(1)}`],
    ] as const)('%s %s without a token returns 401', async (method, url) => {
      const response = await app.inject({ method, url, ...(method === 'GET' ? {} : { payload: { title: 'x' } }) });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(db.requests).toHaveLength(0);
    });

    it.each([
      ['donor', 'POST', BASE],
      ['sponsor', 'PATCH', `${BASE}/${E(1)}`],
    ] as const)('%s cannot %s %s (403)', async (user, method, url) => {
      const response = await app.inject({
        method,
        url,
        headers: auth(user),
        payload: { title: 'x', location: 'y', event_date: '2026-12-02' },
      });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(db.requests).toHaveLength(0);
    });
  });

  describe('GET /events', () => {
    it('shows a signed-in user only scheduled events', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth('donor') });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([E(2)]);
    });

    it('shows an administrator every event, earliest first', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([E(2), E(1)]);
    });
  });

  describe('POST /events', () => {
    it('creates an event for the caller administrator profile and accepts a calendar date', async () => {
      const response = await app.inject({
        method: 'POST',
        url: BASE,
        headers: auth('admin'),
        payload: { title: ' Food drive ', location: 'Alexandra', event_date: '2026-12-15', status: 'scheduled', admin_id: ROLE_IDS.admin2 },
      });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({
        admin_id: ROLE_IDS.admin,
        title: 'Food drive',
        location: 'Alexandra',
        event_date: '2026-12-15T00:00:00.000Z',
        status: 'scheduled',
      });
    });

    it('returns 400 for a bad event_date', async () => {
      const response = await app.inject({
        method: 'POST',
        url: BASE,
        headers: auth('admin'),
        payload: { title: 'Food drive', location: 'Alexandra', event_date: 'next week' },
      });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requestsTo('events', 'POST')).toHaveLength(0);
    });
  });

  describe('PATCH /events/:id', () => {
    it('updates an event', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `${BASE}/${E(1)}`,
        headers: auth('admin'),
        payload: { status: 'completed' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row }>().data).toMatchObject({ id: E(1), status: 'completed', admin_id: ROLE_IDS.admin });
    });

    it('returns 404 for a missing event', async () => {
      expectErrorShape(
        await app.inject({ method: 'PATCH', url: `${BASE}/${MISSING}`, headers: auth('admin'), payload: { status: 'cancelled' } }),
        404,
        'NOT_FOUND',
      );
    });
  });
});
