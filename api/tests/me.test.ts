import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { todayInJohannesburg } from '../src/shared/utils/dates.js';
import { FakeSupabase, LATER, PUBLISHABLE_KEY, expectErrorShape, type Row } from './helpers/fakeSupabase.js';
import { ACCOUNTS, ROLE_IDS, USERS, auth, seedWith } from './helpers/fixtures.js';
import { NOW } from './helpers/schema.js';

// /api/v1/me routes against the real supabase-js client and an in-memory PostgREST that emulates the
// live RLS policies and triggers (tests/helpers). No network calls and no production data.
const BASE = '/api/v1/me';
const db = new FakeSupabase(ACCOUNTS);

const settingsRow = (userId: string, overrides: Row = {}): Row => ({ user_id: userId, created_at: NOW, updated_at: NOW, ...overrides });

describe('me API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await db.buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    db.reset(seedWith({ user_settings: [settingsRow(USERS.donor.id, { theme_preference: 'dark' })] }));
  });

  describe('authentication', () => {
    it.each([
      ['GET', BASE],
      ['PATCH', BASE],
      ['POST', `${BASE}/profile`],
      ['GET', `${BASE}/settings`],
      ['PUT', `${BASE}/settings`],
    ] as const)('%s %s without a token returns 401 without touching the database', async (method, url) => {
      const response = await app.inject({ method, url, ...(method === 'GET' ? {} : { payload: { full_name: 'x' } }) });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(db.requests).toHaveLength(0);
    });

    it('rejects a suspended account with 403 ACCOUNT_DISABLED', async () => {
      const get = await app.inject({ method: 'GET', url: BASE, headers: auth('suspended') });
      expectErrorShape(get, 403, 'ACCOUNT_DISABLED');
      const put = await app.inject({ method: 'PUT', url: `${BASE}/settings`, headers: auth('suspended'), payload: { theme_preference: 'dark' } });
      expectErrorShape(put, 403, 'ACCOUNT_DISABLED');
      expect(db.requests).toHaveLength(0);
    });

    it('rejects an invalid token with 401', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: { authorization: 'Bearer not-a-real-token' } });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('GET /me', () => {
    it('returns the profile plus the role profile of the stored role', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth('donor') });
      expect(response.statusCode).toBe(200);
      const { data } = response.json<{ data: { profile: Row; role_profile: Row } }>();
      expect(data.profile).toMatchObject({ id: USERS.donor.id, role: 'donor', full_name: 'Dineo Donor', email: USERS.donor.email, account_status: 'active' });
      expect(data.profile).not.toHaveProperty('avatar_change_count');
      expect(data.role_profile).toMatchObject({ id: ROLE_IDS.donor, user_id: USERS.donor.id, member_since: '2026-01-01', donation_preference: null });
      expect(db.requestsTo('profiles')[0]?.url.searchParams.get('id')).toBe(`eq.${USERS.donor.id}`);
      expect(db.requestsTo('donor_profiles')[0]?.url.searchParams.get('user_id')).toBe(`eq.${USERS.donor.id}`);
    });

    it.each([
      ['beneficiary', 'beneficiary_profiles', ROLE_IDS.beneficiary],
      ['volunteer', 'volunteer_profiles', ROLE_IDS.volunteer],
      ['sponsor', 'sponsor_profiles', ROLE_IDS.sponsor],
      ['admin', 'administrator_profiles', ROLE_IDS.admin],
    ] as const)('%s gets the row of %s', async (user, table, roleId) => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth(user) });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: { role_profile: Row } }>().data.role_profile.id).toBe(roleId);
      expect(db.requestsTo(table)).toHaveLength(1);
    });

    it('an administrator only gets their own profile (RLS would show every profile)', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth('admin') });
      expect(response.json<{ data: { profile: Row } }>().data.profile.id).toBe(USERS.admin.id);
      expect(db.requestsTo('profiles')[0]?.url.searchParams.get('id')).toBe(`eq.${USERS.admin.id}`);
    });

    it('returns role_profile null when the role profile row is missing', async () => {
      db.tables.donor_profiles = db.rows('donor_profiles').filter((row) => row.user_id !== USERS.donor.id);
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth('donor') });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: { role_profile: unknown } }>().data.role_profile).toBeNull();
    });

    it('returns 404 for a signed-in user without a profile row', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth('noProfile') });
      expectErrorShape(response, 404, 'NOT_FOUND');
    });

    it('uses the caller token and the publishable key only', async () => {
      await app.inject({ method: 'GET', url: BASE, headers: auth('donor') });
      for (const request of db.requests) {
        expect(request.authorization).toBe(`Bearer ${USERS.donor.token}`);
        expect(request.apikey).toBe(PUBLISHABLE_KEY);
      }
    });
  });

  describe('PATCH /me', () => {
    it('updates full_name and phone_number (trimmed) and returns the updated profile', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: BASE,
        headers: auth('donor'),
        payload: { full_name: '  Dineo M. Donor ', phone_number: '+27 82 555 0101' },
      });
      expect(response.statusCode).toBe(200);
      const { data } = response.json<{ data: { profile: Row } }>();
      expect(data.profile).toMatchObject({ full_name: 'Dineo M. Donor', phone_number: '+27 82 555 0101', updated_at: LATER });
      const patch = db.requestsTo('profiles', 'PATCH')[0];
      expect(patch?.body).toEqual({ full_name: 'Dineo M. Donor', phone_number: '+27 82 555 0101' });
      expect(patch?.url.searchParams.get('id')).toBe(`eq.${USERS.donor.id}`);
    });

    it('returns 400 for an avatar_url that is not an http(s) URL', async () => {
      const response = await app.inject({ method: 'PATCH', url: BASE, headers: auth('donor'), payload: { avatar_url: 'not-a-url' } });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requestsTo('profiles', 'PATCH')).toHaveLength(0);
    });

    it('updates avatar_url on the profile', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: BASE,
        headers: auth('donor'),
        payload: { avatar_url: 'https://example.org/a.png' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: { profile: Row } }>().data.profile.avatar_url).toBe('https://example.org/a.png');
      expect(db.requestsTo('profiles', 'PATCH')[0]?.body).toEqual({ avatar_url: 'https://example.org/a.png' });
    });

    it('clears phone_number with null', async () => {
      db.find('profiles', (row) => row.id === USERS.donor.id)!.phone_number = '0825550101';
      const response = await app.inject({ method: 'PATCH', url: BASE, headers: auth('donor'), payload: { phone_number: null } });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: { profile: Row } }>().data.profile.phone_number).toBeNull();
    });

    it('updates the role profile fields of the caller role only', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: BASE,
        headers: auth('volunteer'),
        payload: { role_profile: { preferred_area: ' Soweto ', availability_status: 'weekends' } },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: { role_profile: Row } }>().data.role_profile).toMatchObject({ preferred_area: 'Soweto', availability_status: 'weekends' });
      const patch = db.requestsTo('volunteer_profiles', 'PATCH')[0];
      expect(patch?.body).toEqual({ preferred_area: 'Soweto', availability_status: 'weekends' });
      expect(patch?.url.searchParams.get('user_id')).toBe(`eq.${USERS.volunteer.id}`);
      expect(db.requestsTo('profiles', 'PATCH')).toHaveLength(0);
    });

    it('updates a sponsor organisation and logo', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: BASE,
        headers: auth('sponsor'),
        payload: { role_profile: { organisation_name: 'Sipho Holdings (Pty) Ltd', logo_url: 'https://example.org/logo.png' } },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: { role_profile: Row } }>().data.role_profile).toMatchObject({ organisation_name: 'Sipho Holdings (Pty) Ltd', logo_url: 'https://example.org/logo.png' });
    });

    it.each([
      ['donor', { residential_address: '1 Main Rd' }],
      ['beneficiary', { donation_preference: 'monthly' }],
      ['admin', { avatar_url: 'https://example.org/a.png' }],
    ] as const)('%s sending a role profile field of another role gets 400 and nothing is written', async (user, roleProfile) => {
      const response = await app.inject({ method: 'PATCH', url: BASE, headers: auth(user), payload: { full_name: 'X', role_profile: roleProfile } });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requests.filter((r) => r.method === 'PATCH')).toHaveLength(0);
    });

    it('ignores role, account_status, email and id in the body (cannot self-promote)', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `${BASE}?role=administrator`,
        headers: { ...auth('donor'), 'x-user-role': 'administrator' },
        payload: { full_name: 'Dineo', role: 'administrator', account_status: 'active', email: 'x@example.org', id: USERS.admin.id },
      });
      expect(response.statusCode).toBe(200);
      expect(db.requestsTo('profiles', 'PATCH')[0]?.body).toEqual({ full_name: 'Dineo' });
      expect(db.find('profiles', (row) => row.id === USERS.donor.id)).toMatchObject({ role: 'donor', email: USERS.donor.email });
    });

    it('returns 400 when only protected fields are sent', async () => {
      const response = await app.inject({ method: 'PATCH', url: BASE, headers: auth('donor'), payload: { role: 'administrator', account_status: 'active' } });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requestsTo('profiles', 'PATCH')).toHaveLength(0);
    });

    it.each([
      ['empty body', {}],
      ['blank full_name', { full_name: '   ' }],
      ['full_name too long', { full_name: 'x'.repeat(121) }],
      ['phone with letters', { phone_number: 'call me' }],
      ['phone too short', { phone_number: '123' }],
      ['non-http avatar', { role_profile: { avatar_url: 'javascript:alert(1)' } }],
      ['empty role_profile', { role_profile: {} }],
      ['blank organisation', { role_profile: { organisation_name: '  ' } }],
    ])('returns 400 for %s', async (_name, payload) => {
      const response = await app.inject({ method: 'PATCH', url: BASE, headers: auth('donor'), payload });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requests.filter((r) => r.method === 'PATCH')).toHaveLength(0);
    });

    it('returns 404 when the role profile row does not exist', async () => {
      db.tables.donor_profiles = [];
      const response = await app.inject({ method: 'PATCH', url: BASE, headers: auth('donor'), payload: { role_profile: { donation_preference: 'monthly' } } });
      expectErrorShape(response, 404, 'NOT_FOUND');
    });

    it('maps a database trigger rejection (42501) to 403 without leaking the message', async () => {
      db.failNext({ status: 403, body: { code: '42501', message: 'Not allowed to change your own role or account status', details: null, hint: 'secret hint' } }, { target: 'profiles', method: 'PATCH' });
      const response = await app.inject({ method: 'PATCH', url: BASE, headers: auth('donor'), payload: { full_name: 'X' } });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(response.body).not.toMatch(/own role|secret hint/);
    });
  });

  describe('POST /me/profile', () => {
    beforeEach(() => {
      // pendingDonor signed up as donor but has no donor_profiles row yet.
      db.tables.donor_profiles = db.rows('donor_profiles').filter((row) => row.user_id !== USERS.pendingDonor.id);
    });

    it('creates the missing role profile for the stored role (201) and sets the name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${BASE}/profile`,
        headers: auth('pendingDonor'),
        payload: { role: 'donor', full_name: 'Pam P. Donor', phone_number: '0825550199' },
      });
      expect(response.statusCode).toBe(201);
      const { data } = response.json<{ data: { profile: Row; role_profile: Row } }>();
      expect(data.profile).toMatchObject({ full_name: 'Pam P. Donor', phone_number: '0825550199', role: 'donor', account_status: 'pending' });
      expect(data.role_profile).toMatchObject({ user_id: USERS.pendingDonor.id, member_since: todayInJohannesburg() });
      expect(db.requestsTo('donor_profiles', 'POST')[0]?.body).toEqual({ user_id: USERS.pendingDonor.id, member_since: todayInJohannesburg() });
    });

    it('a sponsor without organisation_name gets their full name as organisation (NOT NULL column)', async () => {
      db.tables.sponsor_profiles = [];
      const response = await app.inject({ method: 'POST', url: `${BASE}/profile`, headers: auth('sponsor'), payload: { role: 'sponsor' } });
      expect(response.statusCode).toBe(201);
      expect(db.requestsTo('sponsor_profiles', 'POST')[0]?.body).toEqual({ user_id: USERS.sponsor.id, organisation_name: 'Sipho Sponsor' });
    });

    it('uses organisation_name for a sponsor when given', async () => {
      db.tables.sponsor_profiles = [];
      const response = await app.inject({ method: 'POST', url: `${BASE}/profile`, headers: auth('sponsor'), payload: { role: 'sponsor', organisation_name: 'Acme NPC' } });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: { role_profile: Row } }>().data.role_profile.organisation_name).toBe('Acme NPC');
    });

    it('returns 409 when the role profile already exists', async () => {
      const response = await app.inject({ method: 'POST', url: `${BASE}/profile`, headers: auth('donor'), payload: { role: 'donor' } });
      expectErrorShape(response, 409, 'CONFLICT');
      expect(db.requestsTo('donor_profiles', 'POST')).toHaveLength(0);
    });

    it('returns 409 when a different role is requested (users cannot change their own role)', async () => {
      const response = await app.inject({ method: 'POST', url: `${BASE}/profile`, headers: auth('pendingDonor'), payload: { role: 'volunteer' } });
      expectErrorShape(response, 409, 'CONFLICT');
      expect(db.requests.filter((r) => r.method !== 'GET')).toHaveLength(0);
    });

    it('rejects administrator as a role (400) without touching the database', async () => {
      const response = await app.inject({ method: 'POST', url: `${BASE}/profile`, headers: auth('pendingDonor'), payload: { role: 'administrator' } });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });

    it.each([
      ['missing role', {}],
      ['unknown role', { role: 'superuser' }],
      ['blank full name', { role: 'donor', full_name: ' ' }],
    ])('returns 400 for %s', async (_name, payload) => {
      const response = await app.inject({ method: 'POST', url: `${BASE}/profile`, headers: auth('pendingDonor'), payload });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
    });

    it('returns 501 for a user without a profile row (no INSERT policy on public.profiles)', async () => {
      const response = await app.inject({ method: 'POST', url: `${BASE}/profile`, headers: auth('noProfile'), payload: { role: 'donor' } });
      expectErrorShape(response, 501, 'NOT_IMPLEMENTED');
      expect(db.requests.filter((r) => r.method !== 'GET')).toHaveLength(0);
    });

    it('maps a concurrent duplicate (23505) to 409', async () => {
      db.failNext({ status: 409, body: { code: '23505', message: 'duplicate key value violates unique constraint "donor_profiles_user_id_key"', details: null, hint: null } }, { target: 'donor_profiles', method: 'POST' });
      const response = await app.inject({ method: 'POST', url: `${BASE}/profile`, headers: auth('pendingDonor'), payload: { role: 'donor' } });
      expectErrorShape(response, 409, 'CONFLICT');
      expect(response.body).not.toContain('donor_profiles_user_id_key');
    });
  });

  describe('settings', () => {
    it('GET returns the existing settings row without inserting', async () => {
      const response = await app.inject({ method: 'GET', url: `${BASE}/settings`, headers: auth('donor') });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        data: {
          user_id: USERS.donor.id,
          theme_preference: 'dark',
          notify_campaign_updates: true,
          notify_request_updates: true,
          notify_donation_updates: true,
          created_at: NOW,
          updated_at: NOW,
        },
      });
      expect(db.requestsTo('user_settings', 'POST')).toHaveLength(0);
    });

    it('GET creates the default row when it is missing (insert ... on conflict do nothing)', async () => {
      const response = await app.inject({ method: 'GET', url: `${BASE}/settings`, headers: auth('volunteer') });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row }>().data).toMatchObject({
        user_id: USERS.volunteer.id,
        theme_preference: 'system',
        notify_campaign_updates: true,
        notify_request_updates: true,
        notify_donation_updates: true,
      });
      const insert = db.requestsTo('user_settings', 'POST')[0];
      expect(insert?.body).toEqual({ user_id: USERS.volunteer.id });
      expect(insert?.prefer).toContain('resolution=ignore-duplicates');
      expect(insert?.url.searchParams.get('on_conflict')).toBe('user_id');
      expect(db.rows('user_settings').filter((row) => row.user_id === USERS.volunteer.id)).toHaveLength(1);
    });

    it('an administrator only reads their own settings (no admin policy on user_settings)', async () => {
      const response = await app.inject({ method: 'GET', url: `${BASE}/settings`, headers: auth('admin') });
      expect(response.json<{ data: Row }>().data.user_id).toBe(USERS.admin.id);
      expect(db.requestsTo('user_settings', 'GET')[0]?.url.searchParams.get('user_id')).toBe(`eq.${USERS.admin.id}`);
    });

    it('PUT saves the given settings and updated_at changes', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `${BASE}/settings`,
        headers: auth('donor'),
        payload: { theme_preference: 'light', notify_donation_updates: false },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row }>().data).toMatchObject({
        theme_preference: 'light',
        notify_donation_updates: false,
        notify_campaign_updates: true,
        updated_at: LATER,
      });
      const patch = db.requestsTo('user_settings', 'PATCH')[0];
      expect(patch?.body).toEqual({ theme_preference: 'light', notify_donation_updates: false });
      expect(patch?.url.searchParams.get('user_id')).toBe(`eq.${USERS.donor.id}`);
    });

    it('PUT creates the row first when it is missing', async () => {
      const response = await app.inject({ method: 'PUT', url: `${BASE}/settings`, headers: auth('sponsor'), payload: { notify_campaign_updates: false } });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row }>().data).toMatchObject({ user_id: USERS.sponsor.id, notify_campaign_updates: false, theme_preference: 'system' });
    });

    it.each([
      ['theme purple', { theme_preference: 'purple' }],
      ['non-boolean switch', { notify_request_updates: 'yes' }],
      ['empty body', {}],
      ['only unknown fields', { user_id: USERS.admin.id, created_at: '2020-01-01T00:00:00Z' }],
    ])('PUT with %s returns 400 VALIDATION_ERROR', async (_name, payload) => {
      const response = await app.inject({ method: 'PUT', url: `${BASE}/settings`, headers: auth('donor'), payload });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requestsTo('user_settings', 'PATCH')).toHaveLength(0);
    });

    it('PUT ignores user_id in the body and only writes the caller row', async () => {
      db.seed('user_settings', settingsRow(USERS.donor2.id));
      const response = await app.inject({ method: 'PUT', url: `${BASE}/settings`, headers: auth('donor'), payload: { user_id: USERS.donor2.id, theme_preference: 'light' } });
      expect(response.statusCode).toBe(200);
      expect(db.find('user_settings', (row) => row.user_id === USERS.donor2.id)?.theme_preference).toBe('system');
      expect(db.find('user_settings', (row) => row.user_id === USERS.donor.id)?.theme_preference).toBe('light');
    });

    it.each([
      ['a 5xx response', { status: 503, body: { message: 'upstream down' } }],
      ['a network failure', 'network' as const],
    ])('returns 503 for %s', async (_name, failure) => {
      db.failNext(failure);
      const response = await app.inject({ method: 'GET', url: `${BASE}/settings`, headers: auth('donor') });
      expectErrorShape(response, 503, 'SERVICE_UNAVAILABLE');
      expect(response.body).not.toMatch(/upstream|fetch failed/);
    });

    it('does not expose raw database errors', async () => {
      db.failNext({ status: 400, body: { code: '42703', message: 'column user_settings.secret does not exist', details: 'leaky', hint: null } });
      const response = await app.inject({ method: 'GET', url: `${BASE}/settings`, headers: auth('donor') });
      expectErrorShape(response, 500, 'INTERNAL_ERROR');
      expect(response.body).not.toMatch(/secret|leaky|42703/);
    });
  });

  describe('OpenAPI docs', () => {
    it('documents every /me endpoint with bearer auth and error responses', async () => {
      const response = await app.inject({ method: 'GET', url: '/docs/json' });
      const spec = response.json<{ paths: Record<string, Record<string, { security?: unknown; tags?: string[]; responses: Record<string, unknown> }>> }>();
      const root = spec.paths['/api/v1/me/'] ?? spec.paths['/api/v1/me'];
      const operations = [root?.['get'], root?.['patch'], spec.paths['/api/v1/me/profile']?.['post'], spec.paths['/api/v1/me/settings']?.['get'], spec.paths['/api/v1/me/settings']?.['put']];
      for (const operation of operations) {
        expect(operation?.security).toEqual([{ bearerAuth: [] }]);
        expect(operation?.tags).toEqual(['me']);
        expect(Object.keys(operation?.responses ?? {})).toEqual(expect.arrayContaining(['400', '401', '403', '500', '503']));
      }
      expect(Object.keys(spec.paths['/api/v1/me/profile']?.['post']?.responses ?? {})).toEqual(expect.arrayContaining(['201', '409', '501']));
    });
  });
});


