import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';
import type { UserId } from '../../shared/types/auth.types.js';
import { toRange, type PaginationParams } from '../../shared/utils/pagination.js';
import {
  ARCHIVED_CAMPAIGN_STATUS,
  CAMPAIGN_COLUMNS,
  CAMPAIGN_WRITABLE_FIELDS,
  type Campaign,
  type CampaignPage,
  type CreateCampaignBody,
  type UpdateCampaignBody,
} from './campaign.types.js';

export interface CampaignServiceDeps {
  /** Creates a client that acts as the caller (their token is sent, so RLS applies). Never service-role. */
  createUserClient: (accessToken: string) => SupabaseClient;
}

export interface CampaignService {
  list(accessToken: string, pagination: PaginationParams): Promise<CampaignPage>;
  getById(accessToken: string, id: string): Promise<Campaign>;
  create(accessToken: string, userId: UserId, body: CreateCampaignBody): Promise<Campaign>;
  update(accessToken: string, id: string, body: UpdateCampaignBody): Promise<Campaign>;
  archive(accessToken: string, id: string): Promise<Campaign>;
}

/** Same message for "does not exist" and "hidden by RLS", so restricted rows cannot be detected. */
const notFound = (): ApiError => ApiError.notFound('Campaign not found');

const validationError = (message: string): ApiError => new ApiError(400, ErrorCodes.VALIDATION_ERROR, message);

/** Postgres error codes caused by invalid input values. */
const INVALID_DATA_CODES = new Set(['22P02', '22003', '22007', '22008', '23502', '23514']);
/** PostgREST JWT errors. */
const JWT_ERROR_CODES = new Set(['PGRST301', 'PGRST302', 'PGRST303']);

/**
 * Maps a PostgREST/Postgres error to a safe ApiError. The raw error is only attached as `cause`
 * (logged server-side for 5xx), never returned to the client.
 */
function toApiError(error: PostgrestError, status: number, action: string): ApiError {
  const options = { cause: error };
  if (status === 0 || status >= 500) {
    return new ApiError(503, ErrorCodes.SERVICE_UNAVAILABLE, 'Campaign service is unavailable', options);
  }
  if (status === 401 || JWT_ERROR_CODES.has(error.code)) {
    return new ApiError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired access token', options);
  }
  if (error.code === '42501' || status === 403) {
    // Row Level Security or a missing grant rejected the write.
    return new ApiError(403, ErrorCodes.FORBIDDEN, 'You do not have permission to perform this action', options);
  }
  if (INVALID_DATA_CODES.has(error.code)) {
    return new ApiError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid campaign data', options);
  }
  if (error.code === '23503' || error.code === '23505') {
    return new ApiError(409, ErrorCodes.CONFLICT, 'The campaign conflicts with existing data', options);
  }
  return new ApiError(500, ErrorCodes.INTERNAL_ERROR, `Unable to ${action} campaign`, options);
}

/** Copies only the writable fields that are present, trimming text and storing an empty category as null. */
function toWritableRow(body: UpdateCampaignBody): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const field of CAMPAIGN_WRITABLE_FIELDS) {
    const value = body[field];
    if (value === undefined) continue;
    if (typeof value === 'string' && (field === 'title' || field === 'description' || field === 'location')) {
      row[field] = value.trim();
    } else if (field === 'category' && typeof value === 'string') {
      row[field] = value.trim() === '' ? null : value.trim();
    } else {
      row[field] = value;
    }
  }
  return row;
}

function assertDateOrder(startDate: string, endDate: string | null | undefined): void {
  // Both are YYYY-MM-DD (validated by the schema), so string order is date order.
  if (endDate !== null && endDate !== undefined && endDate < startDate) {
    throw validationError('end_date must be on or after start_date');
  }
}

/**
 * Campaign data access. Every query runs as the caller through a user-scoped Supabase client, so
 * the database's RLS policies decide what each user can read and write. Retries are disabled so a
 * failing database returns 503 quickly (as in the auth service).
 */
export function createCampaignService(deps: CampaignServiceDeps): CampaignService {
  async function findVisible(client: SupabaseClient, id: string): Promise<Campaign> {
    const { data, error, status } = await client
      .from('campaigns')
      .select(CAMPAIGN_COLUMNS)
      .eq('id', id)
      .maybeSingle<Campaign>()
      .retry(false);
    if (error !== null) throw toApiError(error, status, 'load');
    if (data === null) throw notFound();
    return data;
  }

  return {
    async list(accessToken, pagination) {
      const client = deps.createUserClient(accessToken);
      const { from, to } = toRange(pagination);
      const { data, error, status, count } = await client
        .from('campaigns')
        .select(CAMPAIGN_COLUMNS, { count: 'exact' })
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to)
        .overrideTypes<Campaign[], { merge: false }>()
        .retry(false);

      if (error !== null) {
        // PGRST103: the page starts after the last row. Return an empty page with the real total.
        if (error.code === 'PGRST103') {
          const head = await client
            .from('campaigns')
            .select('id', { count: 'exact', head: true })
            .retry(false);
          if (head.error !== null) throw toApiError(head.error, head.status, 'list');
          return { items: [], total: head.count ?? 0 };
        }
        throw toApiError(error, status, 'list');
      }
      return { items: data ?? [], total: count ?? 0 };
    },

    async getById(accessToken, id) {
      return findVisible(deps.createUserClient(accessToken), id);
    },

    async create(accessToken, userId, body) {
      assertDateOrder(body.start_date, body.end_date);
      const client = deps.createUserClient(accessToken);

      // campaigns.admin_id holds the creator's administrator_profiles.id (as set by the web and
      // mobile admin screens), looked up as the caller. Never taken from the request.
      const admin = await client
        .from('administrator_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle<{ id: string }>()
        .retry(false);
      if (admin.error !== null) throw toApiError(admin.error, admin.status, 'create');
      if (admin.data === null) throw ApiError.forbidden('Administrator profile not found');

      const row = { ...toWritableRow(body), admin_id: admin.data.id };
      const { data, error, status } = await client
        .from('campaigns')
        .insert(row)
        .select(CAMPAIGN_COLUMNS)
        .overrideTypes<Campaign[], { merge: false }>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'create');
      const created = data[0];
      // RLS let the insert through but hides the new row: treat as not permitted.
      if (created === undefined) throw ApiError.forbidden();
      return created;
    },

    async update(accessToken, id, body) {
      const row = toWritableRow(body);
      if (Object.keys(row).length === 0) {
        throw validationError('At least one updatable field is required');
      }
      const client = deps.createUserClient(accessToken);

      if (body.start_date !== undefined || body.end_date !== undefined) {
        if (body.start_date !== undefined && body.end_date !== undefined) {
          assertDateOrder(body.start_date, body.end_date);
        } else {
          const current = await findVisible(client, id);
          assertDateOrder(body.start_date ?? current.start_date, body.end_date === undefined ? current.end_date : body.end_date);
        }
      }

      const { data, error, status } = await client
        .from('campaigns')
        .update(row)
        .eq('id', id)
        .select(CAMPAIGN_COLUMNS)
        .overrideTypes<Campaign[], { merge: false }>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'update');
      const updated = data[0];
      // 0 rows: the campaign does not exist or RLS does not let the caller update it.
      if (updated === undefined) throw notFound();
      return updated;
    },

    async archive(accessToken, id) {
      const client = deps.createUserClient(accessToken);
      const { data, error, status } = await client
        .from('campaigns')
        .update({ status: ARCHIVED_CAMPAIGN_STATUS })
        .eq('id', id)
        .select(CAMPAIGN_COLUMNS)
        .overrideTypes<Campaign[], { merge: false }>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'archive');
      const archived = data[0];
      if (archived === undefined) throw notFound();
      return archived;
    },
  };
}
