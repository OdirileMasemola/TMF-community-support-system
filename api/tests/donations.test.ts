import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { FakeSupabase, expectErrorShape, type Row } from './helpers/fakeSupabase.js';
import { ACCOUNTS, ROLE_IDS, USERS, auth, baseSeed, seedWith } from './helpers/fixtures.js';

// /api/v1/donations and /api/v1/admin/donation-proofs against the real supabase-js client and the
// in-memory PostgREST/RLS/Storage emulation.
const BASE = '/api/v1/donations';
const ADMIN_BASE = '/api/v1/admin/donation-proofs';
const db = new FakeSupabase(ACCOUNTS);

const C = (n: number) => `ca000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const D = (n: number) => `d1000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const P = (n: number) => `9f000000-0000-4000-8000-${n.toString().padStart(12, '0')}`;
const MISSING = '99999999-9999-4999-8999-999999999999';

function campaign(n: number, status: string): Row {
  return {
    id: C(n),
    admin_id: ROLE_IDS.admin,
    title: `Campaign ${n}`,
    description: 'Help',
    location: 'Soweto',
    start_date: '2026-10-01',
    status,
  };
}

function donation(n: number, donorId: string, status: string, date: string, extra: Row = {}): Row {
  return {
    id: D(n),
    donor_id: donorId,
    campaign_id: C(1),
    amount: 100 * n,
    donation_date: date,
    payment_method: 'EFT',
    status,
    donation_kind: 'money',
    payment_reference: `REF-${n}`,
    ...extra,
  };
}

function proof(n: number, donationId: string, ownerId: string, status: string, uploadedAt: string): Row {
  return {
    id: P(n),
    donation_id: donationId,
    file_path: `${ownerId}/proof-${n}.pdf`,
    file_name: `proof-${n}.pdf`,
    verification_status: status,
    uploaded_at: uploadedAt,
  };
}

const MONEY = { amount: 250.5, payment_reference: ' TMF-0001 ' };
const validProof = (n = 1) => ({ file_path: `${USERS.donor.id}/new-proof-${n}.pdf`, file_name: 'pop.pdf', payment_date: '2026-10-07' });

describe('donations API', () => {
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
        donations: [
          donation(1, ROLE_IDS.donor, 'pending', '2026-10-01T08:00:00+00:00'),
          donation(2, ROLE_IDS.donor, 'successful', '2026-10-02T08:00:00+00:00'),
          donation(3, ROLE_IDS.donor, 'failed', '2026-10-03T08:00:00+00:00', { campaign_id: null }),
          donation(4, ROLE_IDS.donor2, 'pending', '2026-10-04T08:00:00+00:00'),
          donation(5, ROLE_IDS.donor, 'pending', '2026-10-05T08:00:00+00:00', { campaign_id: C(3) }),
        ],
        donation_proofs: [
          proof(1, D(1), USERS.donor.id, 'pending', '2026-10-01T09:00:00+00:00'),
          proof(2, D(2), USERS.donor.id, 'approved', '2026-10-02T09:00:00+00:00'),
          proof(3, D(3), USERS.donor.id, 'rejected', '2026-10-03T09:00:00+00:00'),
          proof(4, D(4), USERS.donor2.id, 'pending', '2026-10-04T09:00:00+00:00'),
          proof(5, D(3), USERS.donor.id, 'pending', '2026-10-05T09:00:00+00:00'),
        ],
      }),
    );
  });

  describe('authentication and roles', () => {
    it.each([
      ['POST', BASE],
      ['GET', BASE],
      ['GET', `${BASE}/me`],
      ['POST', `${BASE}/${D(1)}/proofs`],
      ['GET', ADMIN_BASE],
      ['PATCH', `${ADMIN_BASE}/${P(1)}`],
    ] as const)('%s %s without a token returns 401', async (method, url) => {
      const response = await app.inject({ method, url });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(db.requests).toHaveLength(0);
    });

    it.each([
      ['beneficiary', 'POST', BASE],
      ['admin', 'POST', BASE],
      ['donor', 'GET', BASE],
      ['sponsor', 'GET', `${BASE}/me`],
      ['volunteer', 'POST', `${BASE}/${D(1)}/proofs`],
      ['donor', 'GET', ADMIN_BASE],
      ['donor', 'PATCH', `${ADMIN_BASE}/${P(1)}`],
    ] as const)('%s cannot %s %s (403)', async (user, method, url) => {
      const response = await app.inject({ method, url, headers: auth(user), payload: method === 'GET' ? undefined : {} });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(db.requests).toHaveLength(0);
    });

    it('rejects a suspended donor with 403 ACCOUNT_DISABLED', async () => {
      const response = await app.inject({ method: 'POST', url: BASE, headers: auth('suspended'), payload: MONEY });
      expectErrorShape(response, 403, 'ACCOUNT_DISABLED');
      expect(db.rows('donations')).toHaveLength(5);
    });
  });

  describe('POST /donations', () => {
    it('records a pending money donation for my donor profile (201)', async () => {
      const response = await app.inject({ method: 'POST', url: BASE, headers: auth('donor'), payload: { ...MONEY, campaign_id: C(1) } });
      expect(response.statusCode).toBe(201);
      const created = response.json<{ data: Row }>().data;
      expect(created).toMatchObject({
        donor_id: ROLE_IDS.donor,
        campaign_id: C(1),
        amount: 250.5,
        payment_method: 'EFT',
        status: 'pending',
        receipt_number: null,
        donation_kind: 'money',
        item_description: null,
        item_quantity: null,
        payment_reference: 'TMF-0001',
        notes: null,
      });
      expect(db.find('donations', (row) => row.id === created.id)).toMatchObject({ donor_id: ROLE_IDS.donor, status: 'pending' });
      expect(db.requestsTo('donations', 'POST')[0]?.body).toEqual({
        donor_id: ROLE_IDS.donor,
        campaign_id: C(1),
        donation_kind: 'money',
        amount: 250.5,
        payment_method: 'EFT',
        payment_reference: 'TMF-0001',
        item_description: null,
        item_quantity: null,
        notes: null,
        status: 'pending',
      });
    });

    it('forces status pending and ignores status, receipt_number and donor_id from the client', async () => {
      const response = await app.inject({
        method: 'POST',
        url: BASE,
        headers: auth('donor'),
        payload: { ...MONEY, status: 'successful', receipt_number: 'RCPT-1', donor_id: ROLE_IDS.donor2, id: MISSING },
      });
      expect(response.statusCode).toBe(201);
      const created = response.json<{ data: Row }>().data;
      expect(created).toMatchObject({ status: 'pending', receipt_number: null, donor_id: ROLE_IDS.donor });
      expect(created.id).not.toBe(MISSING);
      const body = db.requestsTo('donations', 'POST')[0]?.body as Row;
      expect(body.status).toBe('pending');
      expect(body).not.toHaveProperty('receipt_number');
      expect(body).not.toHaveProperty('id');
      expect(body.donor_id).toBe(ROLE_IDS.donor);
    });

    it('records a general-fund donation without looking up a campaign', async () => {
      const response = await app.inject({ method: 'POST', url: BASE, headers: auth('donor'), payload: MONEY });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data.campaign_id).toBeNull();
      expect(db.requestsTo('campaigns')).toHaveLength(0);
    });

    it('records an in-kind donation without an amount', async () => {
      const response = await app.inject({
        method: 'POST',
        url: BASE,
        headers: auth('donor'),
        payload: { donation_kind: 'in_kind', item_description: ' Blankets ', item_quantity: 20, payment_method: 'Drop-off', notes: 'Winter drive' },
      });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({
        donation_kind: 'in_kind',
        amount: null,
        item_description: 'Blankets',
        item_quantity: 20,
        payment_method: 'Drop-off',
        notes: 'Winter drive',
        status: 'pending',
      });
    });

    it('a pending (not yet approved) donor account can donate', async () => {
      const response = await app.inject({ method: 'POST', url: BASE, headers: auth('pendingDonor'), payload: MONEY });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data.donor_id).toBe(ROLE_IDS.pendingDonor);
    });

    it.each([
      ['money without amount', { payment_reference: 'x' }],
      ['amount 0', { amount: 0 }],
      ['negative amount', { amount: -5 }],
      ['three decimals', { amount: 10.555 }],
      ['amount too large', { amount: 10_000_000_000 }],
      ['money with item fields', { amount: 10, item_description: 'Food', item_quantity: 1 }],
      ['in_kind with amount', { donation_kind: 'in_kind', amount: 10, item_description: 'Food', item_quantity: 1 }],
      ['in_kind without item_description', { donation_kind: 'in_kind', item_quantity: 1 }],
      ['in_kind with blank item_description', { donation_kind: 'in_kind', item_description: '   ', item_quantity: 1 }],
      ['in_kind without item_quantity', { donation_kind: 'in_kind', item_description: 'Food' }],
      ['item_quantity 0', { donation_kind: 'in_kind', item_description: 'Food', item_quantity: 0 }],
      ['unknown kind', { donation_kind: 'crypto', amount: 10 }],
      ['invalid campaign_id', { amount: 10, campaign_id: 'not-a-uuid' }],
      ['blank payment_method', { amount: 10, payment_method: '   ' }],
    ])('returns 400 for %s and creates nothing', async (_name, payload) => {
      const response = await app.inject({ method: 'POST', url: BASE, headers: auth('donor'), payload });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requestsTo('donations', 'POST')).toHaveLength(0);
      expect(db.rows('donations')).toHaveLength(5);
    });

    it.each([
      ['a draft campaign', C(2)],
      ['a closed campaign', C(3)],
      ['a missing campaign', MISSING],
    ])('returns 404 for %s and creates nothing', async (_name, campaignId) => {
      const response = await app.inject({ method: 'POST', url: BASE, headers: auth('donor'), payload: { ...MONEY, campaign_id: campaignId } });
      expectErrorShape(response, 404, 'NOT_FOUND');
      expect(response.json<{ error: { message: string } }>().error.message).toBe('Campaign not found');
      expect(db.requestsTo('donations', 'POST')).toHaveLength(0);
    });

    it('returns 403 when I have no donor profile', async () => {
      const seed = baseSeed();
      seed.donor_profiles = (seed.donor_profiles ?? []).filter((row) => row.user_id !== USERS.donor.id);
      db.reset(seed);
      const response = await app.inject({ method: 'POST', url: BASE, headers: auth('donor'), payload: MONEY });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(response.json<{ error: { message: string } }>().error.message).toBe('Donor profile not found');
      expect(db.rows('donations')).toHaveLength(0);
    });

    it('maps an RLS rejection to 403 and a network failure to 503', async () => {
      db.failNext({ status: 403, body: { code: '42501', message: 'new row violates row-level security policy', details: null, hint: null } }, { target: 'donations', method: 'POST' });
      expectErrorShape(await app.inject({ method: 'POST', url: BASE, headers: auth('donor'), payload: MONEY }), 403, 'FORBIDDEN');
      db.failNext('network', { target: 'donations', method: 'POST' });
      expectErrorShape(await app.inject({ method: 'POST', url: BASE, headers: auth('donor'), payload: MONEY }), 503, 'SERVICE_UNAVAILABLE');
    });

    it('maps a check constraint violation to 400 without leaking it', async () => {
      db.failNext({ status: 400, body: { code: '23514', message: 'violates check constraint "donations_kind_amount_check"', details: null, hint: null } }, { target: 'donations', method: 'POST' });
      const response = await app.inject({ method: 'POST', url: BASE, headers: auth('donor'), payload: MONEY });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(response.body).not.toMatch(/donations_kind_amount_check/);
    });
  });

  describe('GET /donations/me', () => {
    it('lists only my donations, newest first, with campaign and proofs', async () => {
      const response = await app.inject({ method: 'GET', url: `${BASE}/me`, headers: auth('donor') });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([D(5), D(3), D(2), D(1)]);
      expect(body.meta).toEqual({ page: 1, pageSize: 20, total: 4, totalPages: 1 });
      const first = body.data.find((row) => row.id === D(1));
      expect(first?.campaigns).toEqual({ id: C(1), title: 'Campaign 1' });
      expect(first?.donation_proofs).toEqual([{ id: P(1), verification_status: 'pending', uploaded_at: '2026-10-01T09:00:00+00:00' }]);
      // A closed campaign is hidden from donors by RLS, so it embeds as null.
      expect(body.data.find((row) => row.id === D(5))?.campaigns).toBeNull();
      expect(body.data.find((row) => row.id === D(3))?.donation_proofs).toHaveLength(2);
      const query = db.requestsTo('donations', 'GET')[0]?.url.searchParams;
      expect(query?.get('donor_id')).toBe(`eq.${ROLE_IDS.donor}`);
      expect(query?.get('order')).toBe('donation_date.desc,id.desc');
    });

    it('filters by status', async () => {
      const response = await app.inject({ method: 'GET', url: `${BASE}/me?status=pending`, headers: auth('donor') });
      expect(response.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([D(5), D(1)]);
    });

    it('another donor only sees their own', async () => {
      const response = await app.inject({ method: 'GET', url: `${BASE}/me`, headers: auth('donor2') });
      expect(response.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([D(4)]);
    });

    it('paginates and returns an empty page with the real total past the end', async () => {
      const page2 = await app.inject({ method: 'GET', url: `${BASE}/me?page=2&pageSize=3`, headers: auth('donor') });
      expect(page2.json()).toMatchObject({ data: [{ id: D(1) }], meta: { page: 2, pageSize: 3, total: 4, totalPages: 2 } });
      const past = await app.inject({ method: 'GET', url: `${BASE}/me?page=5&pageSize=3`, headers: auth('donor') });
      expect(past.json()).toEqual({ data: [], meta: { page: 5, pageSize: 3, total: 4, totalPages: 2 } });
    });

    it.each(['status=approved', 'page=0', 'pageSize=101'])('returns 400 for %s', async (query) => {
      const response = await app.inject({ method: 'GET', url: `${BASE}/me?${query}`, headers: auth('donor') });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });
  });

  describe('POST /donations/:id/proofs', () => {
    it('adds a pending proof to my pending donation (201)', async () => {
      const response = await app.inject({ method: 'POST', url: `${BASE}/${D(1)}/proofs`, headers: auth('donor'), payload: validProof() });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({
        donation_id: D(1),
        file_path: `${USERS.donor.id}/new-proof-1.pdf`,
        file_name: 'pop.pdf',
        payment_date: '2026-10-07',
        verification_status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        admin_comment: null,
      });
      expect(db.requestsTo('donation_proofs', 'POST')[0]?.body).toEqual({
        donation_id: D(1),
        file_path: `${USERS.donor.id}/new-proof-1.pdf`,
        file_name: 'pop.pdf',
        payment_reference: null,
        payment_date: '2026-10-07',
        verification_status: 'pending',
      });
      expect(db.requestsTo('donations', 'GET')[0]?.url.searchParams.get('donor_id')).toBe(`eq.${ROLE_IDS.donor}`);
    });

    it('ignores verification and review fields from the client', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `${BASE}/${D(1)}/proofs`,
        headers: auth('donor'),
        payload: { ...validProof(), verification_status: 'approved', reviewed_by: ROLE_IDS.admin, admin_comment: 'ok', donation_id: D(4) },
      });
      expect(response.statusCode).toBe(201);
      expect(response.json<{ data: Row }>().data).toMatchObject({ donation_id: D(1), verification_status: 'pending', reviewed_by: null, admin_comment: null });
    });

    it('accepts a new proof for a failed donation (a previous proof was rejected)', async () => {
      const response = await app.inject({ method: 'POST', url: `${BASE}/${D(3)}/proofs`, headers: auth('donor'), payload: validProof() });
      expect(response.statusCode).toBe(201);
    });

    it('returns 409 for a donation that is already successful', async () => {
      const response = await app.inject({ method: 'POST', url: `${BASE}/${D(2)}/proofs`, headers: auth('donor'), payload: validProof() });
      expectErrorShape(response, 409, 'CONFLICT');
      expect(db.requestsTo('donation_proofs', 'POST')).toHaveLength(0);
    });

    it("returns the same 404 for someone else's donation and a missing one", async () => {
      const other = await app.inject({ method: 'POST', url: `${BASE}/${D(4)}/proofs`, headers: auth('donor'), payload: validProof() });
      const missing = await app.inject({ method: 'POST', url: `${BASE}/${MISSING}/proofs`, headers: auth('donor'), payload: validProof() });
      expectErrorShape(other, 404, 'NOT_FOUND');
      expect(other.body).toBe(missing.body);
      expect(db.requestsTo('donation_proofs', 'POST')).toHaveLength(0);
    });

    it.each([
      ["someone else's folder", { file_path: `${USERS.donor2.id}/pop.pdf` }],
      ['the folder only', { file_path: `${USERS.donor.id}/` }],
      ['path traversal', { file_path: `${USERS.donor.id}/../${USERS.donor2.id}/pop.pdf` }],
      ['a leading slash', { file_path: `/${USERS.donor.id}/pop.pdf` }],
      ['no file_path', { file_name: 'pop.pdf' }],
      ['a future payment_date', { file_path: `${USERS.donor.id}/pop.pdf`, payment_date: '2099-01-01' }],
      ['an invalid payment_date', { file_path: `${USERS.donor.id}/pop.pdf`, payment_date: '07/10/2026' }],
    ])('returns 400 for %s without touching the database', async (_name, payload) => {
      const response = await app.inject({ method: 'POST', url: `${BASE}/${D(1)}/proofs`, headers: auth('donor'), payload });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });

    it('returns 400 for an invalid donation id', async () => {
      const response = await app.inject({ method: 'POST', url: `${BASE}/nope/proofs`, headers: auth('donor'), payload: validProof() });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
    });
  });

  describe('GET /admin/donation-proofs', () => {
    it('lists all proofs newest first with the donation and a short-lived signed URL', async () => {
      const response = await app.inject({ method: 'GET', url: ADMIN_BASE, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: Row }>();
      expect(body.data.map((row) => row.id)).toEqual([P(5), P(4), P(3), P(2), P(1)]);
      expect(body.meta).toEqual({ page: 1, pageSize: 20, total: 5, totalPages: 1 });
      const fourth = body.data.find((row) => row.id === P(4));
      expect(fourth?.donations).toMatchObject({ id: D(4), donor_id: ROLE_IDS.donor2, amount: 400, status: 'pending', campaigns: { id: C(1), title: 'Campaign 1' } });
      expect(fourth?.signed_url).toBe(`https://example.supabase.co/storage/v1/object/sign/donation-proofs/${USERS.donor2.id}/proof-4.pdf?token=signed-300`);
      const sign = db.requestsTo('storage:donation-proofs', 'POST');
      expect(sign).toHaveLength(1);
      expect(sign[0]?.authorization).toBe(`Bearer ${USERS.admin.token}`);
      expect(sign[0]?.body).toMatchObject({ expiresIn: 300 });
    });

    it('filters by verification status', async () => {
      const response = await app.inject({ method: 'GET', url: `${ADMIN_BASE}?status=pending`, headers: auth('admin') });
      expect(response.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([P(5), P(4), P(1)]);
      expect(db.requestsTo('donation_proofs', 'GET')[0]?.url.searchParams.get('verification_status')).toBe('eq.pending');
    });

    it('still lists the proofs (signed_url null) when signing fails', async () => {
      db.failNext({ status: 500, body: { statusCode: '500', error: 'Internal', message: 'boom' } }, { target: 'storage:donation-proofs' });
      const response = await app.inject({ method: 'GET', url: ADMIN_BASE, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row[] }>().data.every((row) => row.signed_url === null)).toBe(true);
    });

    it('does not call storage for an empty page', async () => {
      const response = await app.inject({ method: 'GET', url: `${ADMIN_BASE}?page=3`, headers: auth('admin') });
      expect(response.json()).toEqual({ data: [], meta: { page: 3, pageSize: 20, total: 5, totalPages: 1 } });
      expect(db.requestsTo('storage:donation-proofs')).toHaveLength(0);
    });

    it.each(['status=successful', 'pageSize=0'])('returns 400 for %s', async (query) => {
      expectErrorShape(await app.inject({ method: 'GET', url: `${ADMIN_BASE}?${query}`, headers: auth('admin') }), 400, 'VALIDATION_ERROR');
    });

    it('returns 503 when the database is unreachable', async () => {
      db.failNext('network', { target: 'donation_proofs' });
      expectErrorShape(await app.inject({ method: 'GET', url: ADMIN_BASE, headers: auth('admin') }), 503, 'SERVICE_UNAVAILABLE');
    });
  });

  describe('PATCH /admin/donation-proofs/:id', () => {
    it('approving a proof marks the donation successful and records the reviewer', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `${ADMIN_BASE}/${P(1)}`,
        headers: auth('admin'),
        payload: { verification_status: 'approved', admin_comment: ' Payment received ' },
      });
      expect(response.statusCode).toBe(200);
      const data = response.json<{ data: Row }>().data;
      expect(data).toMatchObject({
        id: P(1),
        verification_status: 'approved',
        admin_comment: 'Payment received',
        reviewed_by: ROLE_IDS.admin,
        donations: { id: D(1), status: 'successful' },
      });
      expect(typeof data.reviewed_at).toBe('string');
      expect(Number.isNaN(Date.parse(String(data.reviewed_at)))).toBe(false);
      expect(data.signed_url).toContain(`${USERS.donor.id}/proof-1.pdf`);
      expect(db.find('donations', (row) => row.id === D(1))?.status).toBe('successful');
      expect(db.requestsTo('donations', 'PATCH')[0]?.body).toEqual({ status: 'successful' });
      expect(db.requestsTo('donations', 'PATCH')[0]?.url.searchParams.get('status')).toBe('in.(pending,failed)');
      // Guarded update: a proof another administrator reviewed meanwhile is not overwritten.
      expect(db.requestsTo('donation_proofs', 'PATCH')[0]?.url.searchParams.get('verification_status')).toBe('eq.pending');
      // The donor is notified by the database trigger, not by the API.
      expect(db.requestsTo('notifications')).toHaveLength(0);
      expect(db.rows('notifications')).toMatchObject([{ user_id: USERS.donor.id, related_entity_id: D(1) }]);
    });

    it('rejecting a proof marks a pending donation failed', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `${ADMIN_BASE}/${P(4)}`,
        headers: auth('admin2'),
        payload: { verification_status: 'rejected', admin_comment: 'Reference does not match' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row }>().data).toMatchObject({ verification_status: 'rejected', reviewed_by: ROLE_IDS.admin2, donations: { status: 'failed' } });
      expect(db.find('donations', (row) => row.id === D(4))?.status).toBe('failed');
      expect(db.requestsTo('donations', 'PATCH')[0]?.url.searchParams.get('status')).toBe('in.(pending)');
    });

    it('approving a new proof for a failed donation marks it successful', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_BASE}/${P(5)}`, headers: auth('admin'), payload: { verification_status: 'approved' } });
      expect(response.statusCode).toBe(200);
      expect(db.find('donations', (row) => row.id === D(3))?.status).toBe('successful');
    });

    it('rejecting a proof leaves a successful donation alone', async () => {
      db.seed('donation_proofs', proof(6, D(2), USERS.donor.id, 'pending', '2026-10-06T09:00:00+00:00'));
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_BASE}/${P(6)}`, headers: auth('admin'), payload: { verification_status: 'rejected' } });
      expect(response.statusCode).toBe(200);
      expect(db.find('donations', (row) => row.id === D(2))?.status).toBe('successful');
      expect(db.rows('notifications')).toHaveLength(0);
    });

    it('ignores reviewer fields from the client', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `${ADMIN_BASE}/${P(1)}`,
        headers: auth('admin'),
        payload: { verification_status: 'approved', reviewed_by: ROLE_IDS.admin2, reviewed_at: '2020-01-01T00:00:00Z', donation_id: D(4) },
      });
      expect(response.json<{ data: Row }>().data).toMatchObject({ donation_id: D(1), reviewed_by: ROLE_IDS.admin });
      expect(response.json<{ data: Row }>().data.reviewed_at).not.toBe('2020-01-01T00:00:00Z');
      const body = db.requestsTo('donation_proofs', 'PATCH')[0]?.body as Row;
      expect(Object.keys(body).sort()).toEqual(['reviewed_at', 'reviewed_by', 'verification_status']);
    });

    it('returns 409 for an already reviewed proof and changes nothing', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_BASE}/${P(3)}`, headers: auth('admin'), payload: { verification_status: 'approved' } });
      expectErrorShape(response, 409, 'CONFLICT');
      expect(db.requestsTo('donations', 'PATCH')).toHaveLength(0);
      expect(db.requestsTo('donation_proofs', 'PATCH')).toHaveLength(0);
    });

    it('returns 404 for a missing proof', async () => {
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_BASE}/${MISSING}`, headers: auth('admin'), payload: { verification_status: 'approved' } });
      expectErrorShape(response, 404, 'NOT_FOUND');
    });

    it.each([
      ['pending', { verification_status: 'pending' }],
      ['missing status', { admin_comment: 'x' }],
      ['too long comment', { verification_status: 'rejected', admin_comment: 'x'.repeat(1001) }],
    ])('returns 400 for %s', async (_name, payload) => {
      const response = await app.inject({ method: 'PATCH', url: `${ADMIN_BASE}/${P(1)}`, headers: auth('admin'), payload });
      expectErrorShape(response, 400, 'VALIDATION_ERROR');
      expect(db.requests).toHaveLength(0);
    });

    it('leaves the proof pending when the donation update fails, so it can be retried', async () => {
      db.failNext('network', { target: 'donations', method: 'PATCH' });
      const failed = await app.inject({ method: 'PATCH', url: `${ADMIN_BASE}/${P(1)}`, headers: auth('admin'), payload: { verification_status: 'approved' } });
      expectErrorShape(failed, 503, 'SERVICE_UNAVAILABLE');
      expect(db.find('donation_proofs', (row) => row.id === P(1))?.verification_status).toBe('pending');
      const retry = await app.inject({ method: 'PATCH', url: `${ADMIN_BASE}/${P(1)}`, headers: auth('admin'), payload: { verification_status: 'approved' } });
      expect(retry.statusCode).toBe(200);
    });
  });

  describe('GET /donations', () => {
    it('lists every donation for an administrator, newest first, with the donor', async () => {
      const response = await app.inject({ method: 'GET', url: BASE, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      const body = response.json<{ data: Row[]; meta: { total: number } }>();
      expect(body.meta.total).toBe(5);
      expect(body.data.map((row) => row.id)).toEqual([D(5), D(4), D(3), D(2), D(1)]);
      expect(body.data[0]?.donor_profiles).toMatchObject({
        id: ROLE_IDS.donor,
        profiles: { full_name: 'Dineo Donor', email: USERS.donor.email },
      });
    });

    it('filters by status', async () => {
      const response = await app.inject({ method: 'GET', url: `${BASE}?status=pending`, headers: auth('admin') });
      expect(response.statusCode).toBe(200);
      expect(response.json<{ data: Row[] }>().data.map((row) => row.id)).toEqual([D(5), D(4), D(1)]);
    });
  });

  describe('OpenAPI docs', () => {
    it('documents the donation endpoints', async () => {
      const spec = (await app.inject({ method: 'GET', url: '/docs/json' })).json<{ paths: Record<string, Record<string, { tags?: string[]; security?: unknown; responses: Record<string, unknown> }>> }>();
      const operations = [
        spec.paths['/api/v1/donations']?.['post'],
        spec.paths['/api/v1/donations/me']?.['get'],
        spec.paths['/api/v1/donations/{id}/proofs']?.['post'],
        spec.paths['/api/v1/admin/donation-proofs']?.['get'],
        spec.paths['/api/v1/admin/donation-proofs/{id}']?.['patch'],
      ];
      for (const operation of operations) {
        expect(operation?.tags).toEqual(['donations']);
        expect(operation?.security).toEqual([{ bearerAuth: [] }]);
        expect(Object.keys(operation?.responses ?? {})).toEqual(expect.arrayContaining(['400', '401', '403', '500', '503']));
      }
      expect(Object.keys(operations[0]?.responses ?? {})).toEqual(expect.arrayContaining(['201', '404']));
      expect(Object.keys(operations[4]?.responses ?? {})).toEqual(expect.arrayContaining(['200', '404', '409']));
      const list = spec.paths['/api/v1/donations']?.['get'];
      expect(list?.tags).toEqual(['donations']);
      expect(list?.security).toEqual([{ bearerAuth: [] }]);
    });
  });
});
