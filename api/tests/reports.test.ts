import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FakeSupabase, expectErrorShape, type Row } from './helpers/fakeSupabase.js';
import { ACCOUNTS, ROLE_IDS, auth, seedWith } from './helpers/fixtures.js';

const BASE = '/api/v1/reports';
const db = new FakeSupabase(ACCOUNTS);

const R = (n: number) => `aa000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;

function report(n: number, generatedAt: string): Row {
  return {
    id: R(n),
    admin_id: ROLE_IDS.admin,
    report_name: `Report ${n}`,
    generated_at: generatedAt,
    report_type: 'system_summary',
    status: 'generated',
    metadata: { generated_via: 'test' },
  };
}

describe('reports API', () => {
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
        reports: [report(1, '2026-10-01T08:00:00.000Z'), report(2, '2026-10-03T08:00:00.000Z')],
      }),
    );
  });

  describe('authentication and roles', () => {
    it.each([
      ['GET', BASE],
      ['POST', BASE],
    ] as const)('%s %s without a token returns 401', async (method, url) => {
      const response = await app.inject({
        method,
        url,
        ...(method === 'GET' ? {} : { payload: { report_name: 'x', report_type: 'y' } }),
      });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(db.requests).toHaveLength(0);
    });

    it('rejects a non-administrator with 403', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth('donor') });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(db.requests).toHaveLength(0);
    });
  });

  describe('GET /reports', () => {
    it('lists reports for an administrator, newest first', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([R(2), R(1)]);
    });
  });

  describe('POST /reports', () => {
    it('creates a report for the caller administrator profile and ignores admin_id', async () => {
      const response = await app.inject({
        method: 'POST',
        url: BASE,
        headers: auth('admin'),
        payload: {
          report_name: ' System Summary ',
          report_type: 'system_summary',
          status: 'generated',
          metadata: { generated_via: 'admin_reports_page' },
          admin_id: ROLE_IDS.admin2,
        },
      });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({
        admin_id: ROLE_IDS.admin,
        report_name: 'System Summary',
        report_type: 'system_summary',
        status: 'generated',
        metadata: { generated_via: 'admin_reports_page' },
      });
    });

    it('returns 400 for a status that is not generated or archived', async () => {
      const response = await app.inject({
        method: 'POST',
        url: BASE,
        headers: auth('admin'),
        payload: { report_name: 'Bad', report_type: 'system_summary', status: 'draft' },
      });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requestsTo('reports', 'POST')).toHaveLength(0);
    });
  });
});
