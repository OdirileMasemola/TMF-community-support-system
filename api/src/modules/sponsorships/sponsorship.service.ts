import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { conflictError, toApiError, validationError } from '../../shared/supabase/errors.js';
import { runPagedQuery, type Page } from '../../shared/supabase/query.js';
import { requireRoleProfileId } from '../../shared/supabase/roleProfiles.js';
import type { UserId } from '../../shared/types/auth.types.js';
import { toRange, type PaginationParams } from '../../shared/utils/pagination.js';
import { trimmedOrNull } from '../../shared/utils/text.js';
import {
  REQUEST_COLUMNS,
  RESPONSE_COLUMNS,
  RESPONSE_STATUS,
  SPONSORSHIP_COLUMNS,
  type AdminSponsorship,
  type CreateResponseBody,
  type CreateSponsorshipBody,
  type CreateSponsorshipRequestBody,
  type MySponsorship,
  type Sponsorship,
  type SponsorshipRequest,
  type SponsorshipRequestStatus,
  type SponsorshipRequestWithCampaign,
  type SponsorshipResponse,
  type SponsorshipStatus,
  type UpdateSponsorshipBody,
  type UpdateSponsorshipRequestBody,
} from './sponsorship.types.js';

export interface SponsorshipServiceDeps {
  /** Creates a client that acts as the caller (their token is sent, so RLS applies). Never service-role. */
  createUserClient: (accessToken: string) => SupabaseClient;
}

export interface SponsorshipService {
  create(accessToken: string, userId: UserId, body: CreateSponsorshipBody): Promise<Sponsorship>;
  list(accessToken: string, status: SponsorshipStatus | undefined, pagination: PaginationParams): Promise<Page<AdminSponsorship>>;
  listMine(accessToken: string, userId: UserId, status: SponsorshipStatus | undefined, pagination: PaginationParams): Promise<Page<MySponsorship>>;
  update(accessToken: string, id: string, body: UpdateSponsorshipBody): Promise<Sponsorship>;
  listRequests(accessToken: string, status: SponsorshipRequestStatus | undefined, pagination: PaginationParams): Promise<Page<SponsorshipRequestWithCampaign>>;
  createRequest(accessToken: string, userId: UserId, body: CreateSponsorshipRequestBody): Promise<SponsorshipRequest>;
  updateRequest(accessToken: string, id: string, body: UpdateSponsorshipRequestBody): Promise<SponsorshipRequest>;
  listMyResponses(accessToken: string, userId: UserId, pagination: PaginationParams): Promise<Page<SponsorshipResponse>>;
  respond(accessToken: string, userId: UserId, requestId: string, body: CreateResponseBody): Promise<SponsorshipResponse>;
}

const MY_SPONSORSHIP_SELECT =
  `${SPONSORSHIP_COLUMNS}, campaigns(id, title, category, status, image_url, funding_goal, amount_raised, start_date, end_date)`;
const ADMIN_SPONSORSHIP_SELECT =
  `${SPONSORSHIP_COLUMNS}, campaigns(id, title), sponsor_profiles(id, organisation_name, sponsorship_type, sponsor_level, profiles(email))`;
const REQUEST_SELECT = `${REQUEST_COLUMNS}, campaigns(id, title)`;

type ToError = (error: PostgrestError, status: number) => ApiError;
const listError =
  (resource: string): ToError =>
  (error, status) =>
    toApiError(error, status, 'list', resource);

/** numeric(12,2): at most two decimal places. */
function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
}

/**
 * Sponsorships, sponsorship requests and responses. Sponsors act through "Sponsors create own
 * sponsorships", "Sponsors and admins view sponsorships", "Sponsors view open sponsorship requests",
 * "Sponsors create own responses" and "Sponsors view own sponsorship responses"; administrators read
 * through the same SELECT policies (is_admin()). The insert policies only check ownership, so status is
 * never taken from the request.
 */
export function createSponsorshipService(deps: SponsorshipServiceDeps): SponsorshipService {
  return {
    async create(accessToken, userId, body) {
      if (!hasAtMostTwoDecimals(body.amount)) throw validationError('amount must have at most two decimal places');
      const client = deps.createUserClient(accessToken);
      const sponsorId = await requireRoleProfileId(client, 'sponsor', userId);
      const campaignId = body.campaign_id ?? null;
      if (campaignId !== null) {
        // Sponsors only see active campaigns (RLS), so a draft, closed or missing campaign is "not found".
        const { data, error, status } = await client
          .from('campaigns')
          .select('id, status')
          .eq('id', campaignId)
          .maybeSingle<{ id: string; status: string }>()
          .retry(false);
        if (error !== null) throw toApiError(error, status, 'load', 'campaign');
        if (data === null || data.status !== 'active') throw ApiError.notFound('Campaign not found');
      }
      const { data, error, status } = await client
        .from('sponsorships')
        .insert({
          sponsor_id: sponsorId,
          campaign_id: campaignId,
          amount: body.amount,
          sponsorship_type: trimmedOrNull(body.sponsorship_type),
          status: 'pending',
        })
        .select(SPONSORSHIP_COLUMNS)
        .single<Sponsorship>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'create', 'sponsorship');
      return data;
    },

    async list(accessToken, statusFilter, pagination) {
      const client = deps.createUserClient(accessToken);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client.from('sponsorships').select(head ? 'id' : ADMIN_SPONSORSHIP_SELECT, { count: 'exact', head });
        if (statusFilter !== undefined) query = query.eq('status', statusFilter);
        return query;
      };
      return runPagedQuery<AdminSponsorship>(
        filtered(false)
          .order('sponsorship_date', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<AdminSponsorship[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('sponsorships'),
      );
    },

    async listMine(accessToken, userId, statusFilter, pagination) {
      const client = deps.createUserClient(accessToken);
      const sponsorId = await requireRoleProfileId(client, 'sponsor', userId);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client
          .from('sponsorships')
          .select(head ? 'id' : MY_SPONSORSHIP_SELECT, { count: 'exact', head })
          .eq('sponsor_id', sponsorId);
        if (statusFilter !== undefined) query = query.eq('status', statusFilter);
        return query;
      };
      return runPagedQuery<MySponsorship>(
        filtered(false)
          .order('sponsorship_date', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<MySponsorship[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('sponsorships'),
      );
    },

    async listRequests(accessToken, statusFilter, pagination) {
      // RLS: sponsors only see open requests, administrators see all of them.
      const client = deps.createUserClient(accessToken);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client.from('sponsorship_requests').select(head ? 'id' : REQUEST_SELECT, { count: 'exact', head });
        if (statusFilter !== undefined) query = query.eq('status', statusFilter);
        return query;
      };
      return runPagedQuery<SponsorshipRequestWithCampaign>(
        filtered(false)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<SponsorshipRequestWithCampaign[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('sponsorship requests'),
      );
    },

    async respond(accessToken, userId, requestId, body) {
      const client = deps.createUserClient(accessToken);
      const sponsorId = await requireRoleProfileId(client, 'sponsor', userId);
      const request = await client
        .from('sponsorship_requests')
        .select('id, status')
        .eq('id', requestId)
        .maybeSingle<{ id: string; status: SponsorshipRequestStatus }>()
        .retry(false);
      if (request.error !== null) throw toApiError(request.error, request.status, 'load', 'sponsorship request');
      // Sponsors only see open requests, so a closed or missing request is "not found".
      if (request.data === null || request.data.status !== 'open') throw ApiError.notFound('Sponsorship request not found');

      const sponsorshipId = body.sponsorship_id ?? null;
      if (sponsorshipId !== null) {
        const { data, error, status } = await client
          .from('sponsorships')
          .select('id')
          .eq('id', sponsorshipId)
          .eq('sponsor_id', sponsorId)
          .maybeSingle<{ id: string }>()
          .retry(false);
        if (error !== null) throw toApiError(error, status, 'load', 'sponsorship');
        if (data === null) throw ApiError.notFound('Sponsorship not found');
      }

      // There is no unique constraint on (request_id, sponsor_id), so duplicates are checked here.
      const existing = await client
        .from('sponsorship_request_responses')
        .select('id')
        .eq('request_id', request.data.id)
        .eq('sponsor_id', sponsorId)
        .limit(1)
        .overrideTypes<Array<{ id: string }>, { merge: false }>()
        .retry(false);
      if (existing.error !== null) throw toApiError(existing.error, existing.status, 'load', 'sponsorship response');
      if (existing.data.length > 0) throw conflictError('You have already responded to this sponsorship request');

      const { data, error, status } = await client
        .from('sponsorship_request_responses')
        .insert({
          request_id: request.data.id,
          sponsor_id: sponsorId,
          sponsorship_id: sponsorshipId,
          notes: trimmedOrNull(body.notes),
          status: RESPONSE_STATUS,
        })
        .select(RESPONSE_COLUMNS)
        .single<SponsorshipResponse>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'create', 'sponsorship response');
      return data;
    },

    async update(accessToken, id, body) {
      if (body.amount !== undefined && !hasAtMostTwoDecimals(body.amount)) {
        throw validationError('amount must have at most two decimal places');
      }
      const client = deps.createUserClient(accessToken);
      if (body.campaign_id) {
        const campaign = await client.from('campaigns').select('id').eq('id', body.campaign_id).maybeSingle<{ id: string }>().retry(false);
        if (campaign.error !== null) throw toApiError(campaign.error, campaign.status, 'load', 'campaign');
        if (campaign.data === null) throw ApiError.notFound('Campaign not found');
      }
      const row: Record<string, unknown> = {};
      if (body.amount !== undefined) row.amount = body.amount;
      if (body.campaign_id !== undefined) row.campaign_id = body.campaign_id;
      if (body.sponsorship_type !== undefined) row.sponsorship_type = trimmedOrNull(body.sponsorship_type);
      if (body.status !== undefined) row.status = body.status;
      if (body.sponsorship_date !== undefined) row.sponsorship_date = body.sponsorship_date;
      const { data, error, status } = await client
        .from('sponsorships')
        .update(row)
        .eq('id', id)
        .select(SPONSORSHIP_COLUMNS)
        .maybeSingle<Sponsorship>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'update', 'sponsorship');
      if (data === null) throw ApiError.notFound('Sponsorship not found');
      return data;
    },

    async createRequest(accessToken, userId, body) {
      const client = deps.createUserClient(accessToken);
      const adminId = await requireRoleProfileId(client, 'administrator', userId);
      const campaignId = body.campaign_id ?? null;
      if (campaignId !== null) {
        const campaign = await client.from('campaigns').select('id').eq('id', campaignId).maybeSingle<{ id: string }>().retry(false);
        if (campaign.error !== null) throw toApiError(campaign.error, campaign.status, 'load', 'campaign');
        if (campaign.data === null) throw ApiError.notFound('Campaign not found');
      }
      const row: Record<string, unknown> = {
        title: body.title.trim(),
        requested_support: body.requested_support.trim(),
        campaign_id: campaignId,
        category: trimmedOrNull(body.category),
        priority: trimmedOrNull(body.priority) ?? 'normal',
        deadline: body.deadline ?? null,
        estimated_impact: trimmedOrNull(body.estimated_impact),
        created_by: adminId,
      };
      if (body.status !== undefined) row.status = body.status;
      const { data, error, status } = await client
        .from('sponsorship_requests')
        .insert(row)
        .select(REQUEST_COLUMNS)
        .single<SponsorshipRequest>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'create', 'sponsorship request');
      return data;
    },

    async updateRequest(accessToken, id, body) {
      const client = deps.createUserClient(accessToken);
      if (body.campaign_id) {
        const campaign = await client.from('campaigns').select('id').eq('id', body.campaign_id).maybeSingle<{ id: string }>().retry(false);
        if (campaign.error !== null) throw toApiError(campaign.error, campaign.status, 'load', 'campaign');
        if (campaign.data === null) throw ApiError.notFound('Campaign not found');
      }
      const row: Record<string, unknown> = {};
      if (body.title !== undefined) row.title = body.title.trim();
      if (body.requested_support !== undefined) row.requested_support = body.requested_support.trim();
      if (body.campaign_id !== undefined) row.campaign_id = body.campaign_id;
      if (body.category !== undefined) row.category = trimmedOrNull(body.category);
      if (body.priority !== undefined) row.priority = trimmedOrNull(body.priority);
      if (body.deadline !== undefined) row.deadline = body.deadline;
      if (body.estimated_impact !== undefined) row.estimated_impact = trimmedOrNull(body.estimated_impact);
      if (body.status !== undefined) row.status = body.status;
      const { data, error, status } = await client
        .from('sponsorship_requests')
        .update(row)
        .eq('id', id)
        .select(REQUEST_COLUMNS)
        .maybeSingle<SponsorshipRequest>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'update', 'sponsorship request');
      if (data === null) throw ApiError.notFound('Sponsorship request not found');
      return data;
    },

    async listMyResponses(accessToken, userId, pagination) {
      const client = deps.createUserClient(accessToken);
      const sponsorId = await requireRoleProfileId(client, 'sponsor', userId);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) =>
        client.from('sponsorship_request_responses').select(head ? 'id' : RESPONSE_COLUMNS, { count: 'exact', head }).eq('sponsor_id', sponsorId);
      return runPagedQuery<SponsorshipResponse>(
        filtered(false)
          .order('responded_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<SponsorshipResponse[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('sponsorship responses'),
      );
    },
  };
}
