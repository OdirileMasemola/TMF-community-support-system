import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import type { UserRole } from "@/types/app.types";
import { apiData, apiList } from "@/lib/apiClient";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";

export type EventRow = Tables<"events">;
export type ReportRow = Tables<"reports">;
export type ProfileRow = Tables<"profiles">;

export type AdminDashboardStats = {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  activeCampaigns: number;
  totalDonationAmount: number;
  donationCount: number;
  volunteerApplications: number;
  pendingVolunteerApplications: number;
  sponsors: number;
  beneficiaryRequests: number;
  pendingAssistanceRequests: number;
  pendingDonationProofs: number;
  openSponsorshipRequests: number;
  events: number;
  pendingReviews: number;
};

type DashboardPayload = {
  users: {
    total: number;
    pending: number;
    suspended: number;
    byRole: Record<UserRole, number>;
  };
  campaigns: { total: number; active: number };
  donations: { total: number; successfulAmount: number; pendingProofs: number };
  assistanceRequests: { total: number; awaitingReview: number };
  volunteers: { pendingApplications: number };
  sponsorships: { total: number; openRequests: number };
  events: { scheduled: number };
};

const emptyStats: AdminDashboardStats = {
  totalUsers: 0,
  activeUsers: 0,
  pendingUsers: 0,
  activeCampaigns: 0,
  totalDonationAmount: 0,
  donationCount: 0,
  volunteerApplications: 0,
  pendingVolunteerApplications: 0,
  sponsors: 0,
  beneficiaryRequests: 0,
  pendingAssistanceRequests: 0,
  pendingDonationProofs: 0,
  openSponsorshipRequests: 0,
  events: 0,
  pendingReviews: 0,
};

function toProfileRow(profile: Omit<ProfileRow, "avatar_change_count"> & { avatar_change_count?: number }): ProfileRow {
  return { ...profile, avatar_change_count: profile.avatar_change_count ?? 0 };
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  if (!getSupabaseClientOrNull()) return emptyStats;

  const data = await apiData<DashboardPayload>("/api/v1/admin/dashboard");
  const pendingVolunteerApplications = data.volunteers.pendingApplications;
  const pendingAssistanceRequests = data.assistanceRequests.awaitingReview;
  const pendingDonationProofs = data.donations.pendingProofs;
  const openSponsorshipRequests = data.sponsorships.openRequests;

  return {
    totalUsers: data.users.total,
    activeUsers: Math.max(0, data.users.total - data.users.pending - data.users.suspended),
    pendingUsers: data.users.pending,
    activeCampaigns: data.campaigns.active,
    totalDonationAmount: data.donations.successfulAmount,
    donationCount: data.donations.total,
    volunteerApplications: pendingVolunteerApplications,
    pendingVolunteerApplications,
    sponsors: data.users.byRole.sponsor,
    beneficiaryRequests: data.assistanceRequests.total,
    pendingAssistanceRequests,
    pendingDonationProofs,
    openSponsorshipRequests,
    events: data.events.scheduled,
    pendingReviews: pendingVolunteerApplications + pendingAssistanceRequests + pendingDonationProofs + openSponsorshipRequests,
  };
}

export async function fetchProfiles(): Promise<ProfileRow[]> {
  if (!getSupabaseClientOrNull()) return [];
  const rows = await apiList<Omit<ProfileRow, "avatar_change_count"> & { avatar_change_count?: number }>("/api/v1/admin/users");
  return rows.map(toProfileRow);
}

export async function updateProfileAccountStatus(userId: string, accountStatus: ProfileRow["account_status"]): Promise<void> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  await apiData(`/api/v1/admin/users/${userId}/status`, {
    method: "PATCH",
    body: { account_status: accountStatus },
  });
}

function eventBody(values: {
  title?: string;
  location?: string;
  event_date?: string;
  description?: string | null;
  campaign_id?: string | null;
  status?: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (values.title !== undefined) body.title = values.title;
  if (values.location !== undefined) body.location = values.location;
  if (values.event_date !== undefined) body.event_date = values.event_date;
  if (values.description !== undefined) body.description = values.description;
  if (values.campaign_id !== undefined) body.campaign_id = values.campaign_id;
  if (values.status !== undefined) body.status = values.status;
  return body;
}

export async function fetchEvents(): Promise<EventRow[]> {
  if (!getSupabaseClientOrNull()) return [];
  return apiList<EventRow>("/api/v1/events");
}

export async function createEvent(payload: TablesInsert<"events">): Promise<EventRow> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  return apiData<EventRow>("/api/v1/events", { method: "POST", body: eventBody(payload) });
}

export async function updateEvent(id: string, values: TablesUpdate<"events">): Promise<void> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  const body = eventBody(values);
  if (Object.keys(body).length === 0) throw new Error("At least one event field is required.");
  await apiData(`/api/v1/events/${id}`, { method: "PATCH", body });
}

export async function fetchReports(): Promise<ReportRow[]> {
  if (!getSupabaseClientOrNull()) return [];
  return apiList<ReportRow>("/api/v1/reports");
}

export async function createReport(payload: TablesInsert<"reports">): Promise<ReportRow> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  const body: Record<string, unknown> = {
    report_name: payload.report_name,
    report_type: payload.report_type,
  };
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.metadata !== undefined) body.metadata = payload.metadata;
  if (payload.file_path !== undefined) body.file_path = payload.file_path;
  return apiData<ReportRow>("/api/v1/reports", { method: "POST", body });
}
