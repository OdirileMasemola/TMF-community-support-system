import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { toApiError, validationError } from '../../shared/supabase/errors.js';
import { runPagedQuery, type Page } from '../../shared/supabase/query.js';
import { requireRoleProfileId } from '../../shared/supabase/roleProfiles.js';
import type { UserId } from '../../shared/types/auth.types.js';
import { toRange, type PaginationParams } from '../../shared/utils/pagination.js';
import { trimmedOrNull } from '../../shared/utils/text.js';
import { EVENT_COLUMNS, type CreateEventBody, type Event, type EventStatus, type UpdateEventBody } from './event.types.js';

export interface EventServiceDeps {
  createUserClient: (accessToken: string) => SupabaseClient;
}

export interface EventService {
  list(accessToken: string, status: EventStatus | undefined, pagination: PaginationParams): Promise<Page<Event>>;
  create(accessToken: string, userId: UserId, body: CreateEventBody): Promise<Event>;
  update(accessToken: string, id: string, body: UpdateEventBody): Promise<Event>;
}

const listError = (error: PostgrestError, status: number): ApiError => toApiError(error, status, 'list', 'events');

/** Accepts a calendar date or an ISO date-time. The column is timestamptz. */
function eventDate(value: string): string {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/.test(trimmed) || Number.isNaN(Date.parse(trimmed))) {
    throw validationError('event_date must be a date (YYYY-MM-DD) or an ISO date-time');
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T00:00:00.000Z` : trimmed;
}

/**
 * Events. Reads follow "Admins manage events" and "Authenticated users view scheduled events".
 * Writes are administrator-only; admin_id is the caller's administrator profile.
 */
export function createEventService(deps: EventServiceDeps): EventService {
  async function assertCampaign(client: SupabaseClient, campaignId: string | null | undefined): Promise<void> {
    if (!campaignId) return;
    const campaign = await client.from('campaigns').select('id').eq('id', campaignId).maybeSingle<{ id: string }>().retry(false);
    if (campaign.error !== null) throw toApiError(campaign.error, campaign.status, 'load', 'campaign');
    if (campaign.data === null) throw ApiError.notFound('Campaign not found');
  }

  return {
    async list(accessToken, statusFilter, pagination) {
      const client = deps.createUserClient(accessToken);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client.from('events').select(head ? 'id' : EVENT_COLUMNS, { count: 'exact', head });
        if (statusFilter !== undefined) query = query.eq('status', statusFilter);
        return query;
      };
      return runPagedQuery<Event>(
        filtered(false).order('event_date', { ascending: true }).order('id', { ascending: true }).range(from, to).overrideTypes<Event[], { merge: false }>().retry(false),
        () => filtered(true).retry(false),
        listError,
      );
    },

    async create(accessToken, userId, body) {
      const client = deps.createUserClient(accessToken);
      const adminId = await requireRoleProfileId(client, 'administrator', userId);
      await assertCampaign(client, body.campaign_id);
      const row: Record<string, unknown> = {
        admin_id: adminId,
        title: body.title.trim(),
        location: body.location.trim(),
        event_date: eventDate(body.event_date),
        description: trimmedOrNull(body.description),
        campaign_id: body.campaign_id ?? null,
      };
      if (body.status !== undefined) row.status = body.status;
      const { data, error, status } = await client.from('events').insert(row).select(EVENT_COLUMNS).single<Event>().retry(false);
      if (error !== null) throw toApiError(error, status, 'create', 'event');
      return data;
    },

    async update(accessToken, id, body) {
      const client = deps.createUserClient(accessToken);
      await assertCampaign(client, body.campaign_id);
      const row: Record<string, unknown> = {};
      if (body.title !== undefined) row.title = body.title.trim();
      if (body.location !== undefined) row.location = body.location.trim();
      if (body.event_date !== undefined) row.event_date = eventDate(body.event_date);
      if (body.description !== undefined) row.description = trimmedOrNull(body.description);
      if (body.campaign_id !== undefined) row.campaign_id = body.campaign_id;
      if (body.status !== undefined) row.status = body.status;
      const { data, error, status } = await client
        .from('events')
        .update(row)
        .eq('id', id)
        .select(EVENT_COLUMNS)
        .maybeSingle<Event>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'update', 'event');
      if (data === null) throw ApiError.notFound('Event not found');
      return data;
    },
  };
}
