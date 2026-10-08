import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeSupabase, expectErrorShape, type Row } from './helpers/fakeSupabase.js';
import { ACCOUNTS, ROLE_IDS, USERS, auth, baseSeed, seedWith } from './helpers/fixtures.js';

// Volunteer opportunities, applications, assignments and hours against the real supabase-js client and
// the in-memory PostgREST/RLS emulation.
const V1 = '/api/v1';
const OPPORTUNITIES = `${V1}/volunteer/opportunities`;
const APPLICATIONS = `${V1}/campaign-applications`;
const ADMIN_APPLICATIONS = `${V1}/admin/campaign-applications`;
const MY_ASSIGNMENTS = `${V1}/volunteer-assignments/me`;
const HOURS = `${V1}/volunteer-hours`;
const db = new FakeSupabase(ACCOUNTS);

const C = (n: number) => `ca000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const A = (n: number) => `aa000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const AS = (n: number) => `a5000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const H = (n: number) => `ee000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const MISSING = '99999999-9999-4999-8999-999999999999';

function campaign(n: number, status: string, startDate: string): Row {
  return { id: C(n), admin_id: ROLE_IDS.admin, title: `Campaign ${n}`, description: 'Help', location: 'Soweto', start_date: startDate, status };
}

function application(n: number, volunteerId: string, campaignId: string, status: string, date: string, role: string | null = null): Row {
  return { id: A(n), volunteer_id: volunteerId, campaign_id: campaignId, status, application_date: date, participation_role: role };
}

function assignment(n: number, volunteerId: string, campaignId: string, applicationId: string | null, createdAt: string, status = 'upcoming'): Row {
  return { id: AS(n), application_id: applicationId, volunteer_id: volunteerId, campaign_id: campaignId, role: 'Helper', status, created_at: createdAt };
}

function hours(n: number, volunteerId: string, assignmentId: string | null, value: number, workDate: string): Row {
  return { id: H(n), volunteer_id: volunteerId, assignment_id: assignmentId, hours: value, work_date: workDate, recorded_at: `${workDate}T18:00:00+00:00` };
}

describe('volunteers API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Only Date is faked: "today" is 2026-10-08 in Johannesburg, so "this month" is October 2026.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-08T10:00:00Z'));
    app = await db.buildApp();
  });

  afterAll(async () => {
    await app.close();
    vi.useRealTimers();
  });

  beforeEach(() => {
    db.reset(
      seedWith({
        campaigns: [
          campaign(1, 'active', '2026-11-01'),
          campaign(2, 'active', '2026-10-15'),
          campaign(3, 'draft', '2026-10-01'),
          campaign(4, 'closed', '2026-08-01'),
          campaign(5, 'active', '2026-12-01'),
        ],
        campaign_applications: [
          application(1, ROLE_IDS.volunteer, C(1), 'pending', '2026-10-01T08:00:00+00:00', 'Driver'),
          application(2, ROLE_IDS.volunteer, C(4), 'approved', '2026-07-01T08:00:00+00:00'),
          application(3, ROLE_IDS.volunteer2, C(1), 'pending', '2026-10-03T08:00:00+00:00'),
          application(4, ROLE_IDS.volunteer2, C(2), 'rejected', '2026-10-04T08:00:00+00:00'),
          application(5, ROLE_IDS.volunteer, C(2), 'approved', '2026-10-02T08:00:00+00:00'),
        ],
        volunteer_assignments: [
          assignment(1, ROLE_IDS.volunteer, C(4), A(2), '2026-07-02T08:00:00+00:00', 'completed'),
          assignment(2, ROLE_IDS.volunteer2, C(2), null, '2026-09-10T08:00:00+00:00'),
          assignment(3, ROLE_IDS.volunteer, C(2), null, '2026-09-15T08:00:00+00:00', 'active'),
        ],
        volunteer_hours: [
          hours(1, ROLE_IDS.volunteer, AS(1), 2.5, '2026-10-02'),
          hours(2, ROLE_IDS.volunteer, null, 3.25, '2026-09-20'),
          hours(3, ROLE_IDS.volunteer2, AS(2), 4, '2026-10-03'),
          hours(4, ROLE_IDS.volunteer, AS(1), 1.1, '2026-10-05'),
        ],
      }),
    );
  });

  describe('authentication and roles', () => {
    it.each([
      ['GET', OPPORTUNITIES],
      ['POST', APPLICATIONS],
      ['GET', APPLICATIONS],
      ['GET', `${APPLICATIONS}/me`],
      ['PATCH', `${ADMIN_APPLICATIONS}/${A(1)}`],
      ['GET', MY_ASSIGNMENTS],
      ['POST', HOURS],
      ['GET', HOURS],
      ['GET', `${HOURS}/me`],
    ] as const)('%s %s without a token returns 401', async (method, url) => {
      const response = await app.inject({ method, url });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(db.requests).toHaveLength(0);
    });

    it.each([
      ['admin', 'GET', OPPORTUNITIES],
      ['donor', 'POST', APPLICATIONS],
      ['volunteer', 'GET', APPLICATIONS],
      ['beneficiary', 'GET', `${APPLICATIONS}/me`],
      ['volunteer', 'PATCH', `${ADMIN_APPLICATIONS}/${A(1)}`],
      ['sponsor', 'GET', MY_ASSIGNMENTS],
      ['admin', 'POST', HOURS],
      ['volunteer', 'GET', HOURS],
      ['donor', 'GET', `${HOURS}/me`],
    ] as const)('%s cannot %s %s (403)', async (user, method, url) => {
      const response = await app.inject({ method, url, headers: auth(user), payload: method === 'GET' ? undefined : {} });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(db.requests).toHaveLength(0);
    });

    it('rejects a suspended account with 403 ACCOUNT_DISABLED', async () => {
      expectErrorShape(await app.inject({ method: 'GET', url: OPPORTUNITIES, headers: auth('suspended') }), 403, 'ACCOUNT_DISABLED');
    });
  });

  describe('GET /volunteer/opportunities', () => {
    it('lists active campaigns, earliest start first, with my application status', async () => {
      const response = await app.inject({ method: 'GET', url: OPPORTUNITIES, headers: auth('volunteer') });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => [row.id, row.hasApplied, row.application_status])).toEqual([
        [C(2), true, 'approved'],
        [C(1), true, 'pending'],
        [C(5), false, null],
      ]);
      expect(body.data[0]).toMatchObject({ title: 'Campaign 2', status: 'active', location: 'Soweto' });
      expect(body.meta).toEqual({ page: 1, pageSize: 20, total: 3, totalPages: 1 });
      const query = db.requestsTo('campaign_applications', 'GET')[0]?.url.searchParams;
      expect(query?.get('volunteer_id')).toBe(`eq.${ROLE_IDS.volunteer}`);
      expect(query?.get('campaign_id')).toBe(`in.(${C(2)},${C(1)},${C(5)})`);
      expect(db.requestsTo('campaigns', 'GET')[0]?.url.searchParams.get('status')).toBe('eq.active');
    });

    it('another volunteer sees their own applications', async () => {
      const response = await app.inject({ method: 'GET', url: OPPORTUNITIES, headers: auth('volunteer2') });
      expect(response.json<{ data: Row[] }>().data.map((row) => row.application_status)).toEqual(['rejected', 'pending', null]);
    });

    it('paginates without looking up applications for an empty page', async () => {
      const response = await app.inject({ method: 'GET', url: `${OPPORTUNITIES}?page=2&pageSize=3`, headers: auth('volunteer') });
      expect(response.json()).toEqual({ data: [], meta: { page: 2, pageSize: 3, total: 3, totalPages: 1 } });
      expect(db.requestsTo('campaign_applications')).toHaveLength(0);
    });
  });

  describe('POST /campaign-applications', () => {
    it('applies to an active campaign as a pending application (201)', async () => {
      const response = await app.inject({ method: 'POST', url: APPLICATIONS, headers: auth('volunteer'), payload: { campaign_id: C(5), participation_role: ' Cook ' } });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({ volunteer_id: ROLE_IDS.volunteer, campaign_id: C(5), status: 'pending', participation_role: 'Cook' });
      expect(db.requestsTo('campaign_applications', 'POST')[0]?.body).toEqual({
        volunteer_id: ROLE_IDS.volunteer,
        campaign_id: C(5),
        participation_role: 'Cook',
        status: 'pending',
      });
    });

    it('ignores status and volunteer_id from the client', async () => {
      const response = await app.inject({
        method: 'POST',
        url: APPLICATIONS,
        headers: auth('volunteer'),
        payload: { campaign_id: C(5), status: 'approved', volunteer_id: ROLE_IDS.volunteer2 },
      });
      expect(response.json<{ data: Row }>().data).toMatchObject({ volunteer_id: ROLE_IDS.volunteer, status: 'pending', participation_role: null });
    });

    it('returns 409 when I already applied to the campaign', async () => {
      const response = await app.inject({ method: 'POST', url: APPLICATIONS, headers: auth('volunteer'), payload: { campaign_id: C(1) } });
      expectErrorShape(response, 409, 'CONFLICT');
      expect(response.json<{ error: { message: string } }>().error.message).toBe('You have already applied to this campaign');
    });

    it.each([C(3), C(4), MISSING])('returns 404 for a campaign that is not active (%s)', async (id) => {
      const response = await app.inject({ method: 'POST', url: APPLICATIONS, headers: auth('volunteer'), payload: { campaign_id: id } });
      expectErrorShape(response, 404, 'NOT_FOUND');
      expect(db.requestsTo('campaign_applications', 'POST')).toHaveLength(0);
    });

    it.each([
      ['no campaign_id', {}],
      ['an invalid campaign_id', { campaign_id: 'x' }],
      ['a long participation_role', { campaign_id: C(5), participation_role: 'x'.repeat(101) }],
    ])('returns 400 for %s', async (_name, payload) => {
      expectErrorShape(await app.inject({ method: 'POST', url: APPLICATIONS, headers: auth('volunteer'), payload }), 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });

    it('returns 403 when I have no volunteer profile', async () => {
      const seed = baseSeed();
      seed.volunteer_profiles = (seed.volunteer_profiles ?? []).filter((row) => row.user_id !== USERS.volunteer.id);
      db.reset(seed);
      const response = await app.inject({ method: 'POST', url: APPLICATIONS, headers: auth('volunteer'), payload: { campaign_id: C(5) } });
      expectErrorShape(response, 403, 'FORBIDDEN');
    });
  });

  describe('GET /campaign-applications (administrators)', () => {
    it('lists all applications newest first with the campaign and the volunteer', async () => {
      const response = await app.inject({ method: 'GET', url: APPLICATIONS, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([A(4), A(3), A(5), A(1), A(2)]);
      expect(body.data[0]).toMatchObject({
        campaigns: { id: C(2), title: 'Campaign 2' },
        volunteer_profiles: { id: ROLE_IDS.volunteer2, user_id: USERS.volunteer2.id, profiles: { full_name: 'Vivi Volunteer', email: USERS.volunteer2.email } },
      });
    });

    it('filters by status and campaign', async () => {
      const response = await app.inject({ method: 'GET', url: `${APPLICATIONS}?status=pending&campaign_id=${C(1)}`, headers: auth('admin') });
      expect(response.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([A(3), A(1)]);
    });
  });

  describe('GET /campaign-applications/me', () => {
    it('lists only my applications; a closed campaign embeds as null', async () => {
      const response = await app.inject({ method: 'GET', url: `${APPLICATIONS}/me`, headers: auth('volunteer') });
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([A(5), A(1), A(2)]);
      expect(body.data[1]?.campaigns).toEqual({ id: C(1), title: 'Campaign 1', category: null, location: 'Soweto', status: 'active' });
      expect(body.data[2]?.campaigns).toBeNull();
      expect(db.requestsTo('campaign_applications', 'GET')[0]?.url.searchParams.get('volunteer_id')).toBe(`eq.${ROLE_IDS.volunteer}`);
    });

    it('filters by status', async () => {
      const response = await app.inject({ method: 'GET', url: `${APPLICATIONS}/me?status=approved`, headers: auth('volunteer') });
      expect(response.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([A(5), A(2)]);
    });
  });

  describe('PATCH /admin/campaign-applications/:id', () => {
    it('approving creates the assignment (role from participation_role) and the database notifies the volunteer', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_APPLICATIONS}/${A(1)}`, headers: auth('admin'), payload: { status: 'approved' } });
      expect(response.statusCode).toBe(200);
      const data = response.json<{ data: Row }>().data;
      expect(data).toMatchObject({ id: A(1), status: 'approved', volunteer_profiles: { id: ROLE_IDS.volunteer } });
      expect(data.assignment).toMatchObject({ application_id: A(1), volunteer_id: ROLE_IDS.volunteer, campaign_id: C(1), role: 'Driver', status: 'upcoming' });
      expect(db.requestsTo('volunteer_assignments', 'POST')[0]?.body).toEqual({
        application_id: A(1),
        volunteer_id: ROLE_IDS.volunteer,
        campaign_id: C(1),
        role: 'Driver',
        status: 'upcoming',
      });
      expect(db.requestsTo('campaign_applications', 'PATCH')[0]?.body).toEqual({ status: 'approved' });
      expect(db.requestsTo('campaign_applications', 'PATCH')[0]?.url.searchParams.get('status')).toBe('eq.pending');
      expect(db.rows('notifications')).toMatchObject([{ user_id: USERS.volunteer.id, related_entity_id: A(1) }]);
    });

    it('rejecting creates no assignment', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_APPLICATIONS}/${A(3)}`, headers: auth('admin'), payload: { status: 'rejected' } });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row }>().data).toMatchObject({ status: 'rejected', assignment: null });
      expect(db.requestsTo('volunteer_assignments')).toHaveLength(0);
    });

    it('approving an approved application again creates its missing assignment (role defaults to Volunteer)', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_APPLICATIONS}/${A(5)}`, headers: auth('admin'), payload: { status: 'approved' } });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row }>().data.assignment).toMatchObject({ application_id: A(5), role: 'Volunteer' });
      expect(db.requestsTo('campaign_applications', 'PATCH')).toHaveLength(0);
      expect(db.rows('notifications')).toHaveLength(0);
    });

    it('approving an approved application that has an assignment returns it without creating another', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_APPLICATIONS}/${A(2)}`, headers: auth('admin'), payload: { status: 'approved' } });
      expect(response.json<{ data: Row }>().data.assignment).toMatchObject({ id: AS(1) });
      expect(db.requestsTo('volunteer_assignments', 'POST')).toHaveLength(0);
    });

    it.each([
      [2, 'rejected'],
      [4, 'approved'],
      [4, 'rejected'],
    ])('returns 409 for application %i -> %s', async (n, status) => {
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_APPLICATIONS}/${A(n)}`, headers: auth('admin'), payload: { status } });
      expectErrorShape(response, 409, 'CONFLICT');
      expect(db.requestsTo('campaign_applications', 'PATCH')).toHaveLength(0);
      expect(db.requestsTo('volunteer_assignments')).toHaveLength(0);
    });

    it('returns 404 for a missing application and 400 for an invalid status', async () => {
      expectErrorShape(await app.inject({ method: 'PATCH', url: `${ADMIN_APPLICATIONS}/${MISSING}`, headers: auth('admin'), payload: { status: 'approved' } }), 404, 'NOT_FOUND');
      expectErrorShape(await app.inject({ method: 'PATCH', url: `${ADMIN_APPLICATIONS}/${A(1)}`, headers: auth('admin'), payload: { status: 'pending' } }), 400, 'VALIDATION_ERROR');
    });
  });

  describe('GET /volunteer-assignments/me', () => {
    it('lists only my assignments, newest first, with the campaign', async () => {
      const response = await app.inject({ method: 'GET', url: MY_ASSIGNMENTS, headers: auth('volunteer') });
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([AS(3), AS(1)]);
      expect(body.data[0]?.campaigns).toEqual({ id: C(2), title: 'Campaign 2', category: null, location: 'Soweto', image_url: null });
      expect(body.data[1]?.campaigns).toBeNull();
      expect(db.requestsTo('volunteer_assignments', 'GET')[0]?.url.searchParams.get('volunteer_id')).toBe(`eq.${ROLE_IDS.volunteer}`);
    });

    it('filters by status', async () => {
      const response = await app.inject({ method: 'GET', url: `${MY_ASSIGNMENTS}?status=completed`, headers: auth('volunteer') });
      expect(response.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([AS(1)]);
      expectErrorShape(await app.inject({ method: 'GET', url: `${MY_ASSIGNMENTS}?status=cancelled`, headers: auth('volunteer') }), 400, 'VALIDATION_ERROR');
    });
  });

  describe('POST /volunteer-hours', () => {
    it('records hours for one of my assignments (201)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: HOURS,
        headers: auth('volunteer'),
        payload: { hours: 2.75, work_date: '2026-10-08', assignment_id: AS(3), notes: ' Sorting food ', volunteer_id: ROLE_IDS.volunteer2 },
      });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({ volunteer_id: ROLE_IDS.volunteer, assignment_id: AS(3), hours: 2.75, work_date: '2026-10-08', notes: 'Sorting food' });
      expect(db.requestsTo('volunteer_hours', 'POST')[0]?.body).toEqual({
        volunteer_id: ROLE_IDS.volunteer,
        assignment_id: AS(3),
        hours: 2.75,
        work_date: '2026-10-08',
        notes: 'Sorting food',
      });
      expect(db.requestsTo('volunteer_assignments', 'GET')[0]?.url.searchParams.get('volunteer_id')).toBe(`eq.${ROLE_IDS.volunteer}`);
    });

    it('records hours without an assignment', async () => {
      const response = await app.inject({ method: 'POST', url: HOURS, headers: auth('volunteer'), payload: { hours: 1, work_date: '2026-10-01' } });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({ assignment_id: null, notes: null });
      expect(db.requestsTo('volunteer_assignments')).toHaveLength(0);
    });

    it("returns the same 404 for someone else's assignment and a missing one", async () => {
      const other = await app.inject({ method: 'POST', url: HOURS, headers: auth('volunteer'), payload: { hours: 1, work_date: '2026-10-01', assignment_id: AS(2) } });
      const missing = await app.inject({ method: 'POST', url: HOURS, headers: auth('volunteer'), payload: { hours: 1, work_date: '2026-10-01', assignment_id: MISSING } });
      expectErrorShape(other, 404, 'NOT_FOUND');
      expect(other.body).toBe(missing.body);
      expect(db.requestsTo('volunteer_hours', 'POST')).toHaveLength(0);
    });

    it.each([
      ['too few hours', { hours: 0.1, work_date: '2026-10-01' }],
      ['too many hours', { hours: 24.5, work_date: '2026-10-01' }],
      ['three decimals', { hours: 1.555, work_date: '2026-10-01' }],
      ['tomorrow', { hours: 1, work_date: '2026-10-09' }],
      ['a bad date', { hours: 1, work_date: '1/10/2026' }],
      ['no hours', { work_date: '2026-10-01' }],
    ])('returns 400 for %s without touching the database', async (_name, payload) => {
      expectErrorShape(await app.inject({ method: 'POST', url: HOURS, headers: auth('volunteer'), payload }), 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });
  });

  describe('GET /volunteer-hours/me', () => {
    it('lists my entries, latest first, with all-time and this-month totals', async () => {
      const response = await app.inject({ method: 'GET', url: `${HOURS}/me`, headers: auth('volunteer') });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([H(4), H(1), H(2)]);
      expect(body.meta).toEqual({ page: 1, pageSize: 20, total: 3, totalPages: 1, totalHours: 6.85, thisMonthHours: 3.6 });
      for (const request of db.requestsTo('volunteer_hours', 'GET')) {
        expect(request.url.searchParams.get('volunteer_id')).toBe(`eq.${ROLE_IDS.volunteer}`);
      }
    });

    it('the totals cover every entry, not just the page', async () => {
      const response = await app.inject({ method: 'GET', url: `${HOURS}/me?pageSize=1`, headers: auth('volunteer') });
      expect(response.json()).toMatchObject({ data: [{ id: H(4) }], meta: { total: 3, totalPages: 3, totalHours: 6.85, thisMonthHours: 3.6 } });
    });

    it('adds up more entries than one PostgREST page in chunks', async () => {
      for (let n = 100; n < 1101; n += 1) db.seed('volunteer_hours', hours(n, ROLE_IDS.volunteer, null, 0.5, '2026-08-01'));
      const response = await app.inject({ method: 'GET', url: `${HOURS}/me`, headers: auth('volunteer') });
      expect(response.json<{ meta: Row }>().meta).toMatchObject({ total: 1004, totalHours: 507.35, thisMonthHours: 3.6 });
      expect(db.requestsTo('volunteer_hours', 'GET')).toHaveLength(3);
    });

    it('returns zero totals when I have no hours', async () => {
      const response = await app.inject({ method: 'GET', url: `${HOURS}/me`, headers: auth('volunteer2') });
      expect(response.json<{ meta: Row }>().meta).toMatchObject({ total: 1, totalHours: 4, thisMonthHours: 4 });
      db.reset(baseSeed());
      const empty = await app.inject({ method: 'GET', url: `${HOURS}/me`, headers: auth('volunteer') });
      expect(empty.json()).toEqual({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 0, totalHours: 0, thisMonthHours: 0 } });
    });
  });

  describe('GET /volunteer-hours (administrators)', () => {
    it('lists everyone’s hours with the assignment and volunteer', async () => {
      const response = await app.inject({ method: 'GET', url: HOURS, headers: auth('admin') });
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([H(4), H(3), H(1), H(2)]);
      expect(body.data[1]).toMatchObject({
        volunteer_assignments: { id: AS(2), role: 'Helper', campaign_id: C(2) },
        volunteer_profiles: { id: ROLE_IDS.volunteer2, profiles: { full_name: 'Vivi Volunteer' } },
      });
    });

    it('filters by volunteer', async () => {
      const response = await app.inject({ method: 'GET', url: `${HOURS}?volunteer_id=${ROLE_IDS.volunteer2}`, headers: auth('admin') });
      expect(response.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([H(3)]);
      expectErrorShape(await app.inject({ method: 'GET', url: `${HOURS}?volunteer_id=x`, headers: auth('admin') }), 400, 'VALIDATION_ERROR');
    });

    it('returns 503 when the database is unreachable', async () => {
      db.failNext('network', { target: 'volunteer_hours' });
      expectErrorShape(await app.inject({ method: 'GET', url: HOURS, headers: auth('admin') }), 503, 'SERVICE_UNAVAILABLE');
    });
  });

  describe('OpenAPI docs', () => {
    it('documents the volunteer endpoints', async () => {
      const spec = (await app.inject({ method: 'GET', url: '/docs/json' })).json<{ paths: Record<string, Record<string, { tags?: string[]; security?: unknown; responses: Record<string, unknown> }>> }>();
      const operations = [
        spec.paths['/api/v1/volunteer/opportunities']?.['get'],
        spec.paths['/api/v1/campaign-applications']?.['post'],
        spec.paths['/api/v1/campaign-applications']?.['get'],
        spec.paths['/api/v1/campaign-applications/me']?.['get'],
        spec.paths['/api/v1/admin/campaign-applications/{id}']?.['patch'],
        spec.paths['/api/v1/volunteer-assignments/me']?.['get'],
        spec.paths['/api/v1/volunteer-hours']?.['post'],
        spec.paths['/api/v1/volunteer-hours']?.['get'],
        spec.paths['/api/v1/volunteer-hours/me']?.['get'],
      ];
      for (const operation of operations) {
        expect(operation?.tags).toEqual(['volunteers']);
        expect(operation?.security).toEqual([{ bearerAuth: [] }]);
        expect(Object.keys(operation?.responses ?? {})).toEqual(expect.arrayContaining(['400', '401', '403', '500', '503']));
      }
    });
  });
});
