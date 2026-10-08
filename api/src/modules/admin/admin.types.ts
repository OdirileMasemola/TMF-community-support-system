/**
 * Administration types. Users are public.profiles rows (the same Profile model as /me); the
 * dashboard is a set of counts read through the administrator's own RLS access.
 */
import type { AccountStatus, UserRole } from '../../shared/types/auth.types.js';
export { PROFILE_COLUMNS, type Profile } from '../me/me.types.js';

/** Assistance request statuses that still need an administrator's decision. */
export const AWAITING_REVIEW_STATUSES = ['pending', 'under_review'] as const;

export interface AdminDashboard {
  users: {
    total: number;
    pending: number;
    suspended: number;
    byRole: Record<UserRole, number>;
  };
  campaigns: { total: number; active: number };
  donations: {
    total: number;
    /** Sum of successful money donations, in rand. */
    successfulAmount: number;
    pendingProofs: number;
  };
  assistanceRequests: { total: number; awaitingReview: number };
  volunteers: { pendingApplications: number };
  sponsorships: { total: number; openRequests: number };
  events: { scheduled: number };
}

export interface ListUsersQuery {
  role?: UserRole;
  status?: AccountStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface UserFilters {
  role?: UserRole;
  status?: AccountStatus;
  search?: string;
}

/** PATCH /admin/users/:id/status. Only account_status is accepted. */
export interface UpdateUserStatusBody {
  account_status: AccountStatus;
}

export interface UserIdParams {
  id: string;
}
