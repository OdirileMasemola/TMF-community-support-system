/** Donation types. Field names are the public.donations / public.donation_proofs column names. */

/** Values of the public.payment_status enum (donations.status). */
export const PAYMENT_STATUSES = ['pending', 'successful', 'failed', 'cancelled'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Values of the public.donation_kind enum. */
export const DONATION_KINDS = ['money', 'in_kind'] as const;
export type DonationKind = (typeof DONATION_KINDS)[number];

/** Values of the public.verification_status enum (donation_proofs.verification_status). */
export const VERIFICATION_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** An administrator's decision on a pending proof. */
export const PROOF_DECISIONS = ['approved', 'rejected'] as const;
export type ProofDecision = (typeof PROOF_DECISIONS)[number];

/** Donation statuses a donor may still add a proof of payment to (failed = a previous proof was rejected). */
export const PROOF_ACCEPTING_STATUSES: readonly PaymentStatus[] = ['pending', 'failed'];

/** Storage bucket for proof files; the first folder of every path is the donor's auth user id. */
export const DONATION_PROOFS_BUCKET = 'donation-proofs';
/** Lifetime of the signed proof URLs returned to administrators, in seconds. */
export const SIGNED_URL_TTL_SECONDS = 300;

/** Columns returned by the donation endpoints (same list as web/mobile services/donations.ts). */
export const DONATION_COLUMNS =
  'id, donor_id, campaign_id, amount, donation_date, payment_method, status, receipt_number, donation_kind, item_description, item_quantity, payment_reference, notes';

/** Columns returned by the proof endpoints (same list as web services/donations.ts). */
export const PROOF_COLUMNS =
  'id, donation_id, file_path, file_name, payment_reference, payment_date, admin_comment, verification_status, reviewed_by, reviewed_at, uploaded_at';

export interface Donation {
  id: string;
  donor_id: string;
  campaign_id: string | null;
  amount: number | null;
  donation_date: string;
  payment_method: string;
  status: PaymentStatus;
  receipt_number: string | null;
  donation_kind: DonationKind;
  item_description: string | null;
  item_quantity: number | null;
  payment_reference: string | null;
  notes: string | null;
}

export interface DonationProof {
  id: string;
  donation_id: string;
  file_path: string;
  file_name: string | null;
  payment_reference: string | null;
  payment_date: string | null;
  admin_comment: string | null;
  verification_status: VerificationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  uploaded_at: string;
}

/** A donation in GET /donations (administrators), with its campaign and donor. */
export interface AdminDonation extends Donation {
  campaigns: { id: string; title: string } | null;
  donor_profiles: {
    id: string;
    user_id: string;
    profiles: { full_name: string; email: string } | null;
  } | null;
}

/** A donation in GET /donations/me, with its campaign and proofs. */
export interface MyDonation extends Donation {
  campaigns: { id: string; title: string } | null;
  donation_proofs: Array<Pick<DonationProof, 'id' | 'verification_status' | 'uploaded_at'>>;
}

/** A proof in the admin endpoints, with its donation and a short-lived signed file URL. */
export interface ReviewProof extends DonationProof {
  donations: (Pick<
    Donation,
    'id' | 'donor_id' | 'campaign_id' | 'amount' | 'donation_kind' | 'payment_reference' | 'donation_date' | 'status'
  > & { campaigns: { id: string; title: string } | null }) | null;
  signed_url: string | null;
}

/** POST /donations. status, receipt_number and donor_id are never accepted from the client. */
export interface CreateDonationBody {
  donation_kind?: DonationKind;
  campaign_id?: string | null;
  amount?: number | null;
  payment_method?: string;
  payment_reference?: string | null;
  item_description?: string | null;
  item_quantity?: number | null;
  notes?: string | null;
}

/** POST /donations/:id/proofs. verification_status and the review fields are never accepted. */
export interface CreateProofBody {
  file_path: string;
  file_name?: string | null;
  payment_reference?: string | null;
  payment_date?: string | null;
}

/** PATCH /admin/donation-proofs/:id */
export interface ReviewProofBody {
  verification_status: ProofDecision;
  admin_comment?: string | null;
}

export interface ListDonationsQuery {
  status?: PaymentStatus;
  page?: number;
  pageSize?: number;
}

export interface ListMyDonationsQuery {
  status?: PaymentStatus;
  page?: number;
  pageSize?: number;
}

export interface ListProofsQuery {
  status?: VerificationStatus;
  page?: number;
  pageSize?: number;
}

export interface DonationIdParams {
  id: string;
}
