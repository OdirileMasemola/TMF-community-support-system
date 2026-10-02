/**
 * Campaign types. Field names are the `public.campaigns` column names (snake_case), the same
 * shape web/ and mobile/ use (`Tables<"campaigns">`), so the apps can switch to the API without
 * remapping fields.
 */

/** Values of the `public.campaign_status` enum. */
export const CAMPAIGN_STATUSES = ['draft', 'active', 'closed', 'cancelled'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/**
 * Status used by DELETE /campaigns/:id. Campaigns are never hard-deleted: donations, sponsorships,
 * applications, assignments, events and sponsorship requests reference them, and `authenticated`
 * has no DELETE grant on `public.campaigns`.
 */
export const ARCHIVED_CAMPAIGN_STATUS: CampaignStatus = 'cancelled';

/** Columns returned by every campaign endpoint (same list as web/mobile `services/campaigns.ts`). */
export const CAMPAIGN_COLUMNS =
  'id, admin_id, title, description, location, start_date, end_date, status, category, image_url, funding_goal, amount_raised, is_public, created_at, updated_at';

/** A `public.campaigns` row as returned by the API. */
export interface Campaign {
  id: string;
  /** Set by the server from the caller's administrator profile; never from the request. */
  admin_id: string;
  title: string;
  description: string;
  location: string;
  /** YYYY-MM-DD */
  start_date: string;
  /** YYYY-MM-DD */
  end_date: string | null;
  status: CampaignStatus;
  category: string | null;
  image_url: string | null;
  funding_goal: number | null;
  /** Calculated by the database from successful money donations; read-only. */
  amount_raised: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fields a client may send. id, admin_id, amount_raised, created_at and updated_at are
 * server-controlled and are never accepted.
 */
export const CAMPAIGN_WRITABLE_FIELDS = [
  'title',
  'description',
  'location',
  'start_date',
  'end_date',
  'status',
  'category',
  'image_url',
  'funding_goal',
  'is_public',
] as const;
export type CampaignWritableField = (typeof CAMPAIGN_WRITABLE_FIELDS)[number];

/** POST /campaigns body (after schema validation). Omitted optional fields use the column defaults. */
export interface CreateCampaignBody {
  title: string;
  description: string;
  location: string;
  start_date: string;
  end_date?: string | null;
  status?: CampaignStatus;
  category?: string | null;
  image_url?: string | null;
  funding_goal?: number | null;
  is_public?: boolean;
}

/** PATCH /campaigns/:id body (after schema validation). At least one field is required. */
export type UpdateCampaignBody = Partial<CreateCampaignBody>;

export interface CampaignIdParams {
  id: string;
}

export interface ListCampaignsQuery {
  page?: number;
  pageSize?: number;
}

export interface CampaignPage {
  items: Campaign[];
  total: number;
}
