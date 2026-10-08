import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { conflictError, toApiError } from '../../shared/supabase/errors.js';
import { runCountQuery, runPagedQuery, type Page } from '../../shared/supabase/query.js';
import { USER_ROLES, type UserId, type UserRole } from '../../shared/types/auth.types.js';
import { toRange, type PaginationParams } from '../../shared/utils/pagination.js';
import {
  AWAITING_REVIEW_STATUSES,
  PROFILE_COLUMNS,
  type AdminDashboard,
  type Profile,
  type UpdateUserStatusBody,
  type UserFilters,
} from './admin.types.js';

export interface AdminServiceDeps {
  /** Creates a client that acts as the caller (their token is sent, so RLS applies). Never service-role. */
  createUserClient: (accessToken: string) => SupabaseClient;
}

export interface AdminService {
  dashboard(accessToken: string): Promise<AdminDashboard>;
  listUsers(accessToken: string, filters: UserFilters, pagination: PaginationParams): Promise<Page<Profile>>;
  updateUserStatus(accessToken: string, callerId: UserId, userId: string, body: UpdateUserStatusBody): Promise<Profile>;
}

/** Rows read per request when adding up donations (below PostgREST's usual max-rows of 1000). */
const TOTALS_CHUNK = 1000;

const dashboardError = (error: PostgrestError, status: number): ApiError => toApiError(error, status, 'load', 'dashboard');

/**
 * Dashboard, user list and account status changes for administrators. Everything runs as the
 * administrator, through the is_admin() branches of the SELECT policies ("Users can read their own
 * profile", "Donors and admins view donations", ...) and "Admins can update profiles"
 * (is_admin() AND id <> auth.uid()). protect_profile_privileged_fields() lets an administrator change
 * only role and account_status of other users, so the update sends account_status alone.
 */
export function createAdminService(deps: AdminServiceDeps): AdminService {
  /** Sum of successful money donations, read in chunks so max-rows cannot cut it short. Cents avoid float drift. */
  async function successfulDonationAmount(client: SupabaseClient): Promise<number> {
    let cents = 0;
    for (let offset = 0; ; offset += TOTALS_CHUNK) {
      const { data, error, status } = await client
        .from('donations')
        .select('amount')
        .eq('status', 'successful')
        .eq('donation_kind', 'money')
        .order('id', { ascending: true })
        .range(offset, offset + TOTALS_CHUNK - 1)
        .overrideTypes<Array<{ amount: number | string | null }>, { merge: false }>()
        .retry(false);
      if (error !== null) {
        if (error.code === 'PGRST103') break;
        throw dashboardError(error, status);
      }
      for (const row of data) cents += Math.round(Number(row.amount ?? 0) * 100);
      if (data.length < TOTALS_CHUNK) break;
    }
    return cents / 100;
  }

  return {
    async dashboard(accessToken) {
      const client = deps.createUserClient(accessToken);
      const countOf = (table: string, filter?: (query: ReturnType<typeof headQuery>) => ReturnType<typeof headQuery>) => {
        const query = headQuery(client, table);
        return runCountQuery((filter === undefined ? query : filter(query)).retry(false), dashboardError);
      };

      const [
        usersTotal,
        usersPending,
        usersSuspended,
        roleCounts,
        campaignsTotal,
        campaignsActive,
        donationsTotal,
        successfulAmount,
        pendingProofs,
        requestsTotal,
        requestsAwaiting,
        pendingApplications,
        sponsorshipsTotal,
        openRequests,
        scheduledEvents,
      ] = await Promise.all([
        countOf('profiles'),
        countOf('profiles', (q) => q.eq('account_status', 'pending')),
        countOf('profiles', (q) => q.eq('account_status', 'suspended')),
        Promise.all(USER_ROLES.map((role) => countOf('profiles', (q) => q.eq('role', role)))),
        countOf('campaigns'),
        countOf('campaigns', (q) => q.eq('status', 'active')),
        countOf('donations'),
        successfulDonationAmount(client),
        countOf('donation_proofs', (q) => q.eq('verification_status', 'pending')),
        countOf('assistance_requests'),
        countOf('assistance_requests', (q) => q.in('status', [...AWAITING_REVIEW_STATUSES])),
        countOf('campaign_applications', (q) => q.eq('status', 'pending')),
        countOf('sponsorships'),
        countOf('sponsorship_requests', (q) => q.eq('status', 'open')),
        countOf('events', (q) => q.eq('status', 'scheduled')),
      ]);

      const byRole = Object.fromEntries(USER_ROLES.map((role, index) => [role, roleCounts[index] ?? 0])) as Record<UserRole, number>;
      return {
        users: { total: usersTotal, pending: usersPending, suspended: usersSuspended, byRole },
        campaigns: { total: campaignsTotal, active: campaignsActive },
        donations: { total: donationsTotal, successfulAmount, pendingProofs },
        assistanceRequests: { total: requestsTotal, awaitingReview: requestsAwaiting },
        volunteers: { pendingApplications },
        sponsorships: { total: sponsorshipsTotal, openRequests },
        events: { scheduled: scheduledEvents },
      };
    },

    async listUsers(accessToken, filters, pagination) {
      const client = deps.createUserClient(accessToken);
      const { from, to } = toRange(pagination);
      const search = filters.search?.trim() ?? '';
      const filtered = (head: boolean) => {
        let query = client.from('profiles').select(head ? 'id' : PROFILE_COLUMNS, { count: 'exact', head });
        if (filters.role !== undefined) query = query.eq('role', filters.role);
        if (filters.status !== undefined) query = query.eq('account_status', filters.status);
        // The schema only lets through characters that are safe inside or=(...).
        if (search !== '') query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        return query;
      };
      return runPagedQuery<Profile>(
        filtered(false)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<Profile[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        (error, status) => toApiError(error, status, 'list', 'users'),
      );
    },

    async updateUserStatus(accessToken, callerId, userId, body) {
      // The database refuses this too (trigger, 42501); a clear 409 is more useful than a 403.
      if (userId === callerId) throw conflictError('You cannot change your own account status');
      const client = deps.createUserClient(accessToken);
      const { data, error, status } = await client
        .from('profiles')
        .update({ account_status: body.account_status })
        .eq('id', userId)
        .select(PROFILE_COLUMNS)
        .maybeSingle<Profile>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'update', 'user');
      if (data === null) throw ApiError.notFound('User not found');
      return data;
    },
  };
}

/** A `head: true` exact count on a table (filters are added by the caller). */
function headQuery(client: SupabaseClient, table: string) {
  return client.from(table).select('id', { count: 'exact', head: true });
}
