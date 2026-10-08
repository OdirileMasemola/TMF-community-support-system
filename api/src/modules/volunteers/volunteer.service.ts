import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { conflictError, toApiError, validationError } from '../../shared/supabase/errors.js';
import { runPagedQuery, type Page } from '../../shared/supabase/query.js';
import { requireRoleProfileId } from '../../shared/supabase/roleProfiles.js';
import type { UserId } from '../../shared/types/auth.types.js';
import { todayInJohannesburg } from '../../shared/utils/dates.js';
import { toRange, type PaginationParams } from '../../shared/utils/pagination.js';
import { trimmedOrNull } from '../../shared/utils/text.js';
import { CAMPAIGN_COLUMNS, type Campaign } from '../campaigns/campaign.types.js';
import {
  APPLICATION_COLUMNS,
  ASSIGNMENT_COLUMNS,
  DEFAULT_ASSIGNMENT_ROLE,
  HOURS_COLUMNS,
  type AdminApplication,
  type AdminHours,
  type ApplicationStatus,
  type AssignmentStatus,
  type CampaignApplication,
  type CreateApplicationBody,
  type CreateHoursBody,
  type HoursTotals,
  type MyApplication,
  type MyAssignment,
  type Opportunity,
  type ReviewApplicationBody,
  type ReviewedApplication,
  type VolunteerAssignment,
  type VolunteerHours,
} from './volunteer.types.js';

export interface VolunteerServiceDeps {
  /** Creates a client that acts as the caller (their token is sent, so RLS applies). Never service-role. */
  createUserClient: (accessToken: string) => SupabaseClient;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  campaignId?: string;
}

export interface VolunteerService {
  listOpportunities(accessToken: string, userId: UserId, pagination: PaginationParams): Promise<Page<Opportunity>>;
  apply(accessToken: string, userId: UserId, body: CreateApplicationBody): Promise<CampaignApplication>;
  listApplications(accessToken: string, filters: ApplicationFilters, pagination: PaginationParams): Promise<Page<AdminApplication>>;
  listMyApplications(accessToken: string, userId: UserId, status: ApplicationStatus | undefined, pagination: PaginationParams): Promise<Page<MyApplication>>;
  reviewApplication(accessToken: string, id: string, body: ReviewApplicationBody): Promise<ReviewedApplication>;
  listMyAssignments(accessToken: string, userId: UserId, status: AssignmentStatus | undefined, pagination: PaginationParams): Promise<Page<MyAssignment>>;
  recordHours(accessToken: string, userId: UserId, body: CreateHoursBody): Promise<VolunteerHours>;
  listHours(accessToken: string, volunteerId: string | undefined, pagination: PaginationParams): Promise<Page<AdminHours>>;
  listMyHours(accessToken: string, userId: UserId, pagination: PaginationParams): Promise<Page<VolunteerHours> & HoursTotals>;
}

const VOLUNTEER_EMBED = 'volunteer_profiles(id, user_id, profiles(full_name, email))';
const MY_APPLICATION_SELECT = `${APPLICATION_COLUMNS}, campaigns(id, title, category, location, status)`;
const ADMIN_APPLICATION_SELECT = `${APPLICATION_COLUMNS}, campaigns(id, title), ${VOLUNTEER_EMBED}`;
const MY_ASSIGNMENT_SELECT = `${ASSIGNMENT_COLUMNS}, campaigns(id, title, category, location, image_url)`;
const ADMIN_HOURS_SELECT = `${HOURS_COLUMNS}, volunteer_assignments(id, role, campaign_id), ${VOLUNTEER_EMBED}`;
/** Rows read per request when adding up a volunteer's hours (below PostgREST's usual max-rows of 1000). */
const TOTALS_CHUNK = 1000;

type ToError = (error: PostgrestError, status: number) => ApiError;
const listError =
  (resource: string): ToError =>
  (error, status) =>
    toApiError(error, status, 'list', resource);

const campaignNotFound = (): ApiError => ApiError.notFound('Campaign not found');
const applicationNotFound = (): ApiError => ApiError.notFound('Campaign application not found');

/** numeric(6,2): at most two decimal places. */
function hasAtMostTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
}

/** Adds numeric(…,2) values in cents so the totals have no floating point noise. */
function sumHours(values: number[]): number {
  return values.reduce((cents, value) => cents + Math.round(Number(value) * 100), 0) / 100;
}

/**
 * Volunteer opportunities, applications, assignments and hours. Volunteers act through "Volunteers
 * create own applications", "Volunteers and admins can view applications", "Volunteers view own
 * assignments", "Volunteers record own hours" and "Volunteers view own hours"; administrators through
 * "Admins update applications", "Admins manage volunteer assignments" and "Admins manage volunteer
 * hours". The insert policies only check ownership, so status is never taken from the request.
 */
export function createVolunteerService(deps: VolunteerServiceDeps): VolunteerService {
  async function loadAdminApplication(client: SupabaseClient, id: string): Promise<AdminApplication | null> {
    const { data, error, status } = await client
      .from('campaign_applications')
      .select(ADMIN_APPLICATION_SELECT)
      .eq('id', id)
      .maybeSingle<AdminApplication>()
      .retry(false);
    if (error !== null) throw toApiError(error, status, 'load', 'campaign application');
    return data;
  }

  /** The application's assignment, created (as on web) when it does not exist yet. */
  async function ensureAssignment(client: SupabaseClient, application: CampaignApplication): Promise<VolunteerAssignment> {
    const existing = await client
      .from('volunteer_assignments')
      .select(ASSIGNMENT_COLUMNS)
      .eq('application_id', application.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .overrideTypes<VolunteerAssignment[], { merge: false }>()
      .retry(false);
    if (existing.error !== null) throw toApiError(existing.error, existing.status, 'load', 'volunteer assignment');
    const found = existing.data[0];
    if (found !== undefined) return found;
    const { data, error, status } = await client
      .from('volunteer_assignments')
      .insert({
        application_id: application.id,
        volunteer_id: application.volunteer_id,
        campaign_id: application.campaign_id,
        role: application.participation_role?.trim() || DEFAULT_ASSIGNMENT_ROLE,
        status: 'upcoming',
      })
      .select(ASSIGNMENT_COLUMNS)
      .single<VolunteerAssignment>()
      .retry(false);
    if (error !== null) throw toApiError(error, status, 'create', 'volunteer assignment');
    return data;
  }

  return {
    async listOpportunities(accessToken, userId, pagination) {
      const client = deps.createUserClient(accessToken);
      const volunteerId = await requireRoleProfileId(client, 'volunteer', userId);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) =>
        client.from('campaigns').select(head ? 'id' : CAMPAIGN_COLUMNS, { count: 'exact', head }).eq('status', 'active');
      const page = await runPagedQuery<Campaign>(
        filtered(false)
          .order('start_date', { ascending: true })
          .order('id', { ascending: true })
          .range(from, to)
          .overrideTypes<Campaign[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('opportunities'),
      );
      const applied = new Map<string, ApplicationStatus>();
      if (page.items.length > 0) {
        const { data, error, status } = await client
          .from('campaign_applications')
          .select('campaign_id, status')
          .eq('volunteer_id', volunteerId)
          .in('campaign_id', page.items.map((campaign) => campaign.id))
          .overrideTypes<Array<{ campaign_id: string; status: ApplicationStatus }>, { merge: false }>()
          .retry(false);
        if (error !== null) throw toApiError(error, status, 'list', 'opportunities');
        for (const row of data) applied.set(row.campaign_id, row.status);
      }
      return {
        items: page.items.map((campaign) => ({
          ...campaign,
          hasApplied: applied.has(campaign.id),
          application_status: applied.get(campaign.id) ?? null,
        })),
        total: page.total,
      };
    },

    async apply(accessToken, userId, body) {
      const client = deps.createUserClient(accessToken);
      const volunteerId = await requireRoleProfileId(client, 'volunteer', userId);
      const campaign = await client
        .from('campaigns')
        .select('id, status')
        .eq('id', body.campaign_id)
        .maybeSingle<{ id: string; status: string }>()
        .retry(false);
      if (campaign.error !== null) throw toApiError(campaign.error, campaign.status, 'load', 'campaign');
      // Volunteers only see active campaigns (RLS), so a draft, closed or missing campaign is "not found".
      if (campaign.data === null || campaign.data.status !== 'active') throw campaignNotFound();
      const { data, error, status } = await client
        .from('campaign_applications')
        .insert({
          volunteer_id: volunteerId,
          campaign_id: campaign.data.id,
          participation_role: trimmedOrNull(body.participation_role),
          status: 'pending',
        })
        .select(APPLICATION_COLUMNS)
        .single<CampaignApplication>()
        .retry(false);
      if (error !== null) {
        // campaign_applications (volunteer_id, campaign_id) is unique.
        if (error.code === '23505') throw conflictError('You have already applied to this campaign');
        throw toApiError(error, status, 'create', 'campaign application');
      }
      return data;
    },

    async listApplications(accessToken, filters, pagination) {
      const client = deps.createUserClient(accessToken);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client.from('campaign_applications').select(head ? 'id' : ADMIN_APPLICATION_SELECT, { count: 'exact', head });
        if (filters.status !== undefined) query = query.eq('status', filters.status);
        if (filters.campaignId !== undefined) query = query.eq('campaign_id', filters.campaignId);
        return query;
      };
      return runPagedQuery<AdminApplication>(
        filtered(false)
          .order('application_date', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<AdminApplication[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('campaign applications'),
      );
    },

    async listMyApplications(accessToken, userId, statusFilter, pagination) {
      const client = deps.createUserClient(accessToken);
      const volunteerId = await requireRoleProfileId(client, 'volunteer', userId);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client
          .from('campaign_applications')
          .select(head ? 'id' : MY_APPLICATION_SELECT, { count: 'exact', head })
          .eq('volunteer_id', volunteerId);
        if (statusFilter !== undefined) query = query.eq('status', statusFilter);
        return query;
      };
      return runPagedQuery<MyApplication>(
        filtered(false)
          .order('application_date', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<MyApplication[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('campaign applications'),
      );
    },

    async reviewApplication(accessToken, id, body) {
      const client = deps.createUserClient(accessToken);
      const current = await loadAdminApplication(client, id);
      if (current === null) throw applicationNotFound();
      const approve = body.status === 'approved';
      if (current.status === 'pending') {
        // Guarded on pending so a concurrent review is not overwritten. The
        // notify_application_status_change trigger notifies the volunteer.
        const { data, error, status } = await client
          .from('campaign_applications')
          .update({ status: body.status })
          .eq('id', id)
          .eq('status', 'pending')
          .select('id')
          .overrideTypes<Array<{ id: string }>, { merge: false }>()
          .retry(false);
        if (error !== null) throw toApiError(error, status, 'update', 'campaign application');
        if (data.length === 0) throw conflictError('The application was reviewed by someone else; reload it and try again');
      } else if (!(approve && current.status === 'approved')) {
        // Approving an approved application again only makes sure its assignment exists (safe retry).
        throw conflictError('This application has already been reviewed');
      }
      const assignment = approve ? await ensureAssignment(client, current) : null;
      const updated = await loadAdminApplication(client, id);
      if (updated === null) throw applicationNotFound();
      return { ...updated, assignment };
    },

    async listMyAssignments(accessToken, userId, statusFilter, pagination) {
      const client = deps.createUserClient(accessToken);
      const volunteerId = await requireRoleProfileId(client, 'volunteer', userId);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client
          .from('volunteer_assignments')
          .select(head ? 'id' : MY_ASSIGNMENT_SELECT, { count: 'exact', head })
          .eq('volunteer_id', volunteerId);
        if (statusFilter !== undefined) query = query.eq('status', statusFilter);
        return query;
      };
      return runPagedQuery<MyAssignment>(
        filtered(false)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<MyAssignment[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('volunteer assignments'),
      );
    },

    async recordHours(accessToken, userId, body) {
      if (!hasAtMostTwoDecimals(body.hours)) throw validationError('hours must have at most two decimal places');
      if (body.work_date > todayInJohannesburg()) throw validationError('work_date must not be in the future');
      const client = deps.createUserClient(accessToken);
      const volunteerId = await requireRoleProfileId(client, 'volunteer', userId);
      const assignmentId = body.assignment_id ?? null;
      if (assignmentId !== null) {
        const { data, error, status } = await client
          .from('volunteer_assignments')
          .select('id')
          .eq('id', assignmentId)
          .eq('volunteer_id', volunteerId)
          .maybeSingle<{ id: string }>()
          .retry(false);
        if (error !== null) throw toApiError(error, status, 'load', 'volunteer assignment');
        if (data === null) throw ApiError.notFound('Assignment not found');
      }
      const { data, error, status } = await client
        .from('volunteer_hours')
        .insert({
          volunteer_id: volunteerId,
          assignment_id: assignmentId,
          hours: body.hours,
          work_date: body.work_date,
          notes: trimmedOrNull(body.notes),
        })
        .select(HOURS_COLUMNS)
        .single<VolunteerHours>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'create', 'volunteer hours');
      return data;
    },

    async listHours(accessToken, volunteerId, pagination) {
      const client = deps.createUserClient(accessToken);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client.from('volunteer_hours').select(head ? 'id' : ADMIN_HOURS_SELECT, { count: 'exact', head });
        if (volunteerId !== undefined) query = query.eq('volunteer_id', volunteerId);
        return query;
      };
      return runPagedQuery<AdminHours>(
        filtered(false)
          .order('work_date', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<AdminHours[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('volunteer hours'),
      );
    },

    async listMyHours(accessToken, userId, pagination) {
      const client = deps.createUserClient(accessToken);
      const volunteerId = await requireRoleProfileId(client, 'volunteer', userId);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) =>
        client.from('volunteer_hours').select(head ? 'id' : HOURS_COLUMNS, { count: 'exact', head }).eq('volunteer_id', volunteerId);
      const page = await runPagedQuery<VolunteerHours>(
        filtered(false)
          .order('work_date', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<VolunteerHours[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        listError('volunteer hours'),
      );

      // Totals over all entries, read in chunks so PostgREST's max-rows limit cannot cut them short.
      const entries: Array<{ hours: number; work_date: string }> = [];
      for (let offset = 0; ; offset += TOTALS_CHUNK) {
        const { data, error, status } = await client
          .from('volunteer_hours')
          .select('hours, work_date')
          .eq('volunteer_id', volunteerId)
          .order('id', { ascending: true })
          .range(offset, offset + TOTALS_CHUNK - 1)
          .overrideTypes<Array<{ hours: number; work_date: string }>, { merge: false }>()
          .retry(false);
        if (error !== null) {
          if (error.code === 'PGRST103') break;
          throw toApiError(error, status, 'list', 'volunteer hours');
        }
        entries.push(...data);
        if (data.length < TOTALS_CHUNK) break;
      }
      const month = todayInJohannesburg().slice(0, 7);
      return {
        ...page,
        totalHours: sumHours(entries.map((entry) => entry.hours)),
        thisMonthHours: sumHours(entries.filter((entry) => entry.work_date.startsWith(month)).map((entry) => entry.hours)),
      };
    },
  };
}
