/**
 * Volunteer types. Field names are the public.campaign_applications, public.volunteer_assignments and
 * public.volunteer_hours column names.
 */
import type { Campaign } from '../campaigns/campaign.types.js';

/** Values of the public.application_status enum. */
export const APPLICATION_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** An administrator's decision on an application. */
export const APPLICATION_DECISIONS = ['approved', 'rejected'] as const;
export type ApplicationDecision = (typeof APPLICATION_DECISIONS)[number];

/** Values allowed by volunteer_assignment_status_check. */
export const ASSIGNMENT_STATUSES = ['upcoming', 'active', 'completed'] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

/** Role given to an assignment when the application has no participation_role (same as web). */
export const DEFAULT_ASSIGNMENT_ROLE = 'Volunteer';

/** API limits for one volunteer_hours entry (the database only requires hours > 0, numeric(6,2)). */
export const MIN_HOURS = 0.25;
export const MAX_HOURS = 24;

/** Columns returned for an application (same list as web/mobile services/volunteers.ts). */
export const APPLICATION_COLUMNS = 'id, volunteer_id, campaign_id, application_date, status, participation_role';

/** Columns returned for an assignment (same list as web services/volunteers.ts). */
export const ASSIGNMENT_COLUMNS =
  'id, application_id, volunteer_id, campaign_id, role, location, schedule, start_date, end_date, status, created_at';

/** Columns returned for an hours entry (same list as web services/volunteers.ts). */
export const HOURS_COLUMNS = 'id, assignment_id, volunteer_id, hours, work_date, notes, recorded_at';

export interface CampaignApplication {
  id: string;
  volunteer_id: string;
  campaign_id: string;
  application_date: string;
  status: ApplicationStatus;
  participation_role: string | null;
}

export interface VolunteerAssignment {
  id: string;
  application_id: string | null;
  volunteer_id: string;
  campaign_id: string;
  role: string;
  location: string | null;
  schedule: string | null;
  start_date: string | null;
  end_date: string | null;
  status: AssignmentStatus;
  created_at: string;
}

export interface VolunteerHours {
  id: string;
  assignment_id: string | null;
  volunteer_id: string;
  hours: number;
  work_date: string;
  notes: string | null;
  recorded_at: string;
}

export interface VolunteerRef {
  id: string;
  user_id: string;
  profiles: { full_name: string; email: string } | null;
}

/** An active campaign in GET /volunteer/opportunities. */
export interface Opportunity extends Campaign {
  hasApplied: boolean;
  /** Status of my application to this campaign, or null. */
  application_status: ApplicationStatus | null;
}

/** An application in GET /campaign-applications/me. */
export interface MyApplication extends CampaignApplication {
  campaigns: Pick<Campaign, 'id' | 'title' | 'category' | 'location' | 'status'> | null;
}

/** An application in the admin endpoints. */
export interface AdminApplication extends CampaignApplication {
  campaigns: Pick<Campaign, 'id' | 'title'> | null;
  volunteer_profiles: VolunteerRef | null;
}

/** PATCH /admin/campaign-applications/:id response: the application and its assignment (if approved). */
export interface ReviewedApplication extends AdminApplication {
  assignment: VolunteerAssignment | null;
}

/** An assignment in GET /volunteer-assignments/me. */
export interface MyAssignment extends VolunteerAssignment {
  campaigns: Pick<Campaign, 'id' | 'title' | 'category' | 'location' | 'image_url'> | null;
}

/** An hours entry in the admin list. */
export interface AdminHours extends VolunteerHours {
  volunteer_assignments: Pick<VolunteerAssignment, 'id' | 'role' | 'campaign_id'> | null;
  volunteer_profiles: VolunteerRef | null;
}

export interface HoursTotals {
  /** All my hours. */
  totalHours: number;
  /** My hours with a work_date in the current month (Africa/Johannesburg). */
  thisMonthHours: number;
}

/** POST /campaign-applications. status and volunteer_id are never accepted. */
export interface CreateApplicationBody {
  campaign_id: string;
  participation_role?: string | null;
}

/** PATCH /admin/campaign-applications/:id */
export interface ReviewApplicationBody {
  status: ApplicationDecision;
}

/** POST /volunteer-hours. volunteer_id is never accepted. */
export interface CreateHoursBody {
  hours: number;
  work_date: string;
  assignment_id?: string | null;
  notes?: string | null;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

export interface ListApplicationsQuery extends PageQuery {
  status?: ApplicationStatus;
  campaign_id?: string;
}

export interface MyApplicationsQuery extends PageQuery {
  status?: ApplicationStatus;
}

export interface MyAssignmentsQuery extends PageQuery {
  status?: AssignmentStatus;
}

export interface ListHoursQuery extends PageQuery {
  volunteer_id?: string;
}

export interface VolunteerIdParams {
  id: string;
}
