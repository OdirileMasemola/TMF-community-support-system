import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { conflictError, toApiError, validationError } from '../../shared/supabase/errors.js';
import { runPagedQuery, type Page } from '../../shared/supabase/query.js';
import { requireRoleProfileId } from '../../shared/supabase/roleProfiles.js';
import type { UserId } from '../../shared/types/auth.types.js';
import { todayInJohannesburg } from '../../shared/utils/dates.js';
import { toRange, type PaginationParams } from '../../shared/utils/pagination.js';
import { assertOwnFolder } from '../../shared/utils/storagePaths.js';
import { trimmedOrNull } from '../../shared/utils/text.js';
import {
  DONATION_COLUMNS,
  DONATION_PROOFS_BUCKET,
  PROOF_ACCEPTING_STATUSES,
  PROOF_COLUMNS,
  SIGNED_URL_TTL_SECONDS,
  type CreateDonationBody,
  type CreateProofBody,
  type Donation,
  type DonationProof,
  type MyDonation,
  type PaymentStatus,
  type ReviewProof,
  type ReviewProofBody,
  type VerificationStatus,
} from './donation.types.js';

export interface DonationServiceDeps {
  /** Creates a client that acts as the caller (their token is sent, so RLS applies). Never service-role. */
  createUserClient: (accessToken: string) => SupabaseClient;
}

export interface DonationService {
  create(accessToken: string, userId: UserId, body: CreateDonationBody): Promise<Donation>;
  listMine(accessToken: string, userId: UserId, status: PaymentStatus | undefined, pagination: PaginationParams): Promise<Page<MyDonation>>;
  addProof(accessToken: string, userId: UserId, donationId: string, body: CreateProofBody): Promise<DonationProof>;
  listProofs(accessToken: string, status: VerificationStatus | undefined, pagination: PaginationParams): Promise<Page<ReviewProof>>;
  reviewProof(accessToken: string, userId: UserId, id: string, body: ReviewProofBody): Promise<ReviewProof>;
}

const MY_DONATION_SELECT = `${DONATION_COLUMNS}, campaigns(id, title), donation_proofs(id, verification_status, uploaded_at)`;
const REVIEW_PROOF_SELECT =
  `${PROOF_COLUMNS}, donations(id, donor_id, campaign_id, amount, donation_kind, payment_reference, donation_date, status, campaigns(id, title))`;

type ReviewProofRow = Omit<ReviewProof, 'signed_url'>;

/** Same message for "does not exist" and "hidden by RLS / someone else's". */
const donationNotFound = (): ApiError => ApiError.notFound('Donation not found');
const proofNotFound = (): ApiError => ApiError.notFound('Donation proof not found');
const alreadyReviewed = (): ApiError => conflictError('This donation proof has already been reviewed');

/** numeric(12,2): at most two decimal places. */
function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
}

/**
 * Builds the donations row from the request. Mirrors donations_kind_amount_check (money -> amount > 0,
 * in_kind -> amount IS NULL) and the item_quantity > 0 check, so bad input gets a clear 400.
 * status is always 'pending' and receipt_number is never set: only administrators change them.
 */
function donationRow(body: CreateDonationBody, donorId: string): Record<string, unknown> {
  const kind = body.donation_kind ?? 'money';
  const itemDescription = trimmedOrNull(body.item_description);
  const itemQuantity = body.item_quantity ?? null;
  const amount = body.amount ?? null;
  if (kind === 'money') {
    if (amount === null) throw validationError('amount is required for a money donation');
    if (!hasAtMostTwoDecimals(amount)) throw validationError('amount must have at most two decimal places');
    if (itemDescription !== null || itemQuantity !== null) {
      throw validationError('item_description and item_quantity are only allowed for an in_kind donation');
    }
  } else {
    if (amount !== null) throw validationError('amount must not be set for an in_kind donation');
    if (itemDescription === null) throw validationError('item_description is required for an in_kind donation');
    if (itemQuantity === null) throw validationError('item_quantity is required for an in_kind donation');
  }
  return {
    donor_id: donorId,
    campaign_id: body.campaign_id ?? null,
    donation_kind: kind,
    amount,
    payment_method: (body.payment_method ?? 'EFT').trim(),
    payment_reference: trimmedOrNull(body.payment_reference),
    item_description: itemDescription,
    item_quantity: itemQuantity,
    notes: trimmedOrNull(body.notes),
    status: 'pending',
  };
}

/**
 * Donations and proofs of payment. Donors act through "Donors create own donations",
 * "Donors and admins view donations", "Donors create own donation proofs" and "Donors view own
 * donation proofs"; administrators through "Admins manage donation proofs" and "Admins update donations".
 * Those insert policies only check ownership, so the status/verification/review columns are never
 * taken from the request.
 */
export function createDonationService(deps: DonationServiceDeps): DonationService {
  async function signedUrls(client: SupabaseClient, paths: string[]): Promise<Map<string, string>> {
    const urls = new Map<string, string>();
    if (paths.length === 0) return urls;
    try {
      // "Admins manage donation proof files" / "Users read their own donation proofs" (storage.objects).
      const { data, error } = await client.storage.from(DONATION_PROOFS_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
      if (error !== null) return urls;
      for (const item of data) {
        if (item.path !== null && item.signedUrl !== null && item.error === null) urls.set(item.path, item.signedUrl);
      }
    } catch {
      // A missing file or a storage outage must not hide the review queue: signed_url stays null.
    }
    return urls;
  }

  async function withSignedUrls(client: SupabaseClient, rows: ReviewProofRow[]): Promise<ReviewProof[]> {
    const urls = await signedUrls(client, [...new Set(rows.map((row) => row.file_path))]);
    return rows.map((row) => ({ ...row, signed_url: urls.get(row.file_path) ?? null }));
  }

  return {
    async create(accessToken, userId, body) {
      const client = deps.createUserClient(accessToken);
      const donorId = await requireRoleProfileId(client, 'donor', userId);
      const row = donationRow(body, donorId);
      if (row.campaign_id !== null) {
        // Donors only see active campaigns (RLS), so a hidden, draft or closed campaign is "not found".
        const { data, error, status } = await client
          .from('campaigns')
          .select('id, status')
          .eq('id', row.campaign_id)
          .maybeSingle<{ id: string; status: string }>()
          .retry(false);
        if (error !== null) throw toApiError(error, status, 'load', 'campaign');
        if (data === null || data.status !== 'active') throw ApiError.notFound('Campaign not found');
      }
      const { data, error, status } = await client
        .from('donations')
        .insert(row)
        .select(DONATION_COLUMNS)
        .single<Donation>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'create', 'donation');
      return data;
    },

    async listMine(accessToken, userId, statusFilter, pagination) {
      const client = deps.createUserClient(accessToken);
      const donorId = await requireRoleProfileId(client, 'donor', userId);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client
          .from('donations')
          .select(head ? 'id' : MY_DONATION_SELECT, { count: 'exact', head })
          .eq('donor_id', donorId);
        if (statusFilter !== undefined) query = query.eq('status', statusFilter);
        return query;
      };
      return runPagedQuery<MyDonation>(
        filtered(false)
          .order('donation_date', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<MyDonation[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        (error: PostgrestError, code: number) => toApiError(error, code, 'list', 'donations'),
      );
    },

    async addProof(accessToken, userId, donationId, body) {
      assertOwnFolder(body.file_path, userId);
      if (body.payment_date !== undefined && body.payment_date !== null && body.payment_date > todayInJohannesburg()) {
        throw validationError('payment_date must not be in the future');
      }
      const client = deps.createUserClient(accessToken);
      const donorId = await requireRoleProfileId(client, 'donor', userId);
      const { data: donation, error, status } = await client
        .from('donations')
        .select('id, status')
        .eq('id', donationId)
        .eq('donor_id', donorId)
        .maybeSingle<{ id: string; status: PaymentStatus }>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'load', 'donation');
      if (donation === null) throw donationNotFound();
      if (!PROOF_ACCEPTING_STATUSES.includes(donation.status)) {
        throw conflictError('Proof of payment can only be added to a pending or failed donation');
      }
      const inserted = await client
        .from('donation_proofs')
        .insert({
          donation_id: donation.id,
          file_path: body.file_path,
          file_name: trimmedOrNull(body.file_name),
          payment_reference: trimmedOrNull(body.payment_reference),
          payment_date: body.payment_date ?? null,
          verification_status: 'pending',
        })
        .select(PROOF_COLUMNS)
        .single<DonationProof>()
        .retry(false);
      if (inserted.error !== null) throw toApiError(inserted.error, inserted.status, 'create', 'donation proof');
      return inserted.data;
    },

    async listProofs(accessToken, statusFilter, pagination) {
      const client = deps.createUserClient(accessToken);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client.from('donation_proofs').select(head ? 'id' : REVIEW_PROOF_SELECT, { count: 'exact', head });
        if (statusFilter !== undefined) query = query.eq('verification_status', statusFilter);
        return query;
      };
      const page = await runPagedQuery<ReviewProofRow>(
        filtered(false)
          .order('uploaded_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<ReviewProofRow[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        (error: PostgrestError, code: number) => toApiError(error, code, 'list', 'donation proofs'),
      );
      return { items: await withSignedUrls(client, page.items), total: page.total };
    },

    async reviewProof(accessToken, userId, id, body) {
      const client = deps.createUserClient(accessToken);
      const loaded = await client
        .from('donation_proofs')
        .select('id, donation_id, verification_status')
        .eq('id', id)
        .maybeSingle<{ id: string; donation_id: string; verification_status: VerificationStatus }>()
        .retry(false);
      if (loaded.error !== null) throw toApiError(loaded.error, loaded.status, 'load', 'donation proof');
      if (loaded.data === null) throw proofNotFound();
      if (loaded.data.verification_status !== 'pending') throw alreadyReviewed();
      const adminId = await requireRoleProfileId(client, 'administrator', userId);

      // The donation is updated first so a failure can be retried (the proof is still pending).
      // Approving marks it successful (also after an earlier rejection); rejecting only fails a
      // pending donation. Donations that are already final are left alone. The DB triggers send the
      // donor's notification and refresh the campaign's amount_raised.
      const approved = body.verification_status === 'approved';
      const fromStatuses: PaymentStatus[] = approved ? ['pending', 'failed'] : ['pending'];
      const donationUpdate = await client
        .from('donations')
        .update({ status: approved ? 'successful' : 'failed' })
        .eq('id', loaded.data.donation_id)
        .in('status', fromStatuses)
        .select('id')
        .overrideTypes<Array<{ id: string }>, { merge: false }>()
        .retry(false);
      if (donationUpdate.error !== null) throw toApiError(donationUpdate.error, donationUpdate.status, 'update', 'donation');

      const review: Record<string, unknown> = {
        verification_status: body.verification_status,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      };
      if (body.admin_comment !== undefined) review.admin_comment = trimmedOrNull(body.admin_comment);
      const proofUpdate = await client
        .from('donation_proofs')
        .update(review)
        .eq('id', id)
        .eq('verification_status', 'pending')
        .select(REVIEW_PROOF_SELECT)
        .overrideTypes<ReviewProofRow[], { merge: false }>()
        .retry(false);
      if (proofUpdate.error !== null) throw toApiError(proofUpdate.error, proofUpdate.status, 'update', 'donation proof');
      const updated = proofUpdate.data[0];
      // Another administrator reviewed it in the meantime.
      if (updated === undefined) throw alreadyReviewed();
      const [result] = await withSignedUrls(client, [updated]);
      return result ?? { ...updated, signed_url: null };
    },
  };
}
