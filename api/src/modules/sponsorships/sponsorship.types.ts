/**
 * Sponsorship types. Field names are the public.sponsorships, public.sponsorship_requests and
 * public.sponsorship_request_responses column names.
 */
import type { Campaign } from '../campaigns/campaign.types.js';
import { PAYMENT_STATUSES, type PaymentStatus } from '../donations/donation.types.js';

/** sponsorships.status is the public.payment_status enum (shared with donations). */
export const SPONSORSHIP_STATUSES = PAYMENT_STATUSES;
export type SponsorshipStatus = PaymentStatus;

/** Values allowed by sponsorship_request_status_check. */
export const REQUEST_STATUSES = ['open', 'accepted', 'declined', 'closed'] as const;
export type SponsorshipRequestStatus = (typeof REQUEST_STATUSES)[number];

/** Status of a sponsor's response (same value web uses; the column is free text, default 'interested'). */
export const RESPONSE_STATUS = 'interested';

/** Columns returned for a sponsorship (same list as web services/sponsorships.ts). */
export const SPONSORSHIP_COLUMNS = 'id, sponsor_id, campaign_id, amount, sponsorship_date, sponsorship_type, status';

/** Columns returned for a sponsorship request (same list as web services/sponsorships.ts). */
export const REQUEST_COLUMNS =
  'id, campaign_id, title, requested_support, category, priority, deadline, estimated_impact, status, created_by, created_at';

/** Columns returned for a response. */
export const RESPONSE_COLUMNS = 'id, request_id, sponsor_id, sponsorship_id, status, notes, responded_at';

export interface Sponsorship {
  id: string;
  sponsor_id: string;
  campaign_id: string | null;
  amount: number;
  sponsorship_date: string;
  sponsorship_type: string | null;
  status: SponsorshipStatus;
}

export interface SponsorshipRequest {
  id: string;
  campaign_id: string | null;
  title: string;
  requested_support: string;
  category: string | null;
  priority: string | null;
  deadline: string | null;
  estimated_impact: string | null;
  status: SponsorshipRequestStatus;
  created_by: string | null;
  created_at: string;
}

export interface SponsorshipResponse {
  id: string;
  request_id: string;
  sponsor_id: string;
  sponsorship_id: string | null;
  status: string;
  notes: string | null;
  responded_at: string;
}

/** A sponsorship in GET /sponsorships/me. */
export interface MySponsorship extends Sponsorship {
  campaigns: Pick<
    Campaign,
    'id' | 'title' | 'category' | 'status' | 'image_url' | 'funding_goal' | 'amount_raised' | 'start_date' | 'end_date'
  > | null;
}

/** A sponsorship in the admin list. */
export interface AdminSponsorship extends Sponsorship {
  campaigns: Pick<Campaign, 'id' | 'title'> | null;
  sponsor_profiles: {
    id: string;
    organisation_name: string;
    sponsorship_type: string | null;
    sponsor_level: string | null;
    profiles: { email: string } | null;
  } | null;
}

/** A request in GET /sponsorship-requests. */
export interface SponsorshipRequestWithCampaign extends SponsorshipRequest {
  campaigns: Pick<Campaign, 'id' | 'title'> | null;
}

/** POST /sponsorships. status and sponsor_id are never accepted. */
export interface CreateSponsorshipBody {
  amount: number;
  campaign_id?: string | null;
  sponsorship_type?: string | null;
}

/** POST /sponsorship-requests/:id/responses. status and sponsor_id are never accepted. */
export interface CreateResponseBody {
  notes?: string | null;
  sponsorship_id?: string | null;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

export interface ListSponsorshipsQuery extends PageQuery {
  status?: SponsorshipStatus;
}

export interface ListRequestsQuery extends PageQuery {
  status?: SponsorshipRequestStatus;
}

export interface SponsorshipIdParams {
  id: string;
}
