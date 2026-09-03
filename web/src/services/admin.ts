import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";

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

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const client = getSupabaseClientOrNull();
  if (!client) {
    return {
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
  }

  const [
    profilesRes,
    activeUsersRes,
    pendingUsersRes,
    campaignsRes,
    donationsRes,
    applicationsRes,
    pendingAppsRes,
    sponsorsRes,
    assistanceRes,
    pendingAssistanceRes,
    pendingProofsRes,
    openSponsorRequestsRes,
    eventsRes,
  ] = await Promise.all([
    client.from("profiles").select("id", { count: "exact", head: true }),
    client.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "active"),
    client.from("profiles").select("id", { count: "exact", head: true }).eq("account_status", "pending"),
    client.from("campaigns").select("id", { count: "exact", head: true }).eq("status", "active"),
    client.from("donations").select("amount, status"),
    client.from("campaign_applications").select("id", { count: "exact", head: true }),
    client.from("campaign_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    client.from("sponsor_profiles").select("id", { count: "exact", head: true }),
    client.from("assistance_requests").select("id", { count: "exact", head: true }),
    client.from("assistance_requests").select("id", { count: "exact", head: true }).in("status", ["pending", "under_review"]),
    client.from("donation_proofs").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
    client.from("sponsorship_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
    client.from("events").select("id", { count: "exact", head: true }),
  ]);

  const errors = [
    profilesRes.error,
    activeUsersRes.error,
    pendingUsersRes.error,
    campaignsRes.error,
    donationsRes.error,
    applicationsRes.error,
    pendingAppsRes.error,
    sponsorsRes.error,
    assistanceRes.error,
    pendingAssistanceRes.error,
    pendingProofsRes.error,
    openSponsorRequestsRes.error,
    eventsRes.error,
  ].filter(Boolean);

  if (errors.length) {
    logSupabaseError("fetchAdminDashboardStats", errors[0]);
    throw errors[0];
  }

  const donationRows = donationsRes.data ?? [];
  const totalDonationAmount = donationRows
    .filter((row) => row.status === "successful")
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

  const pendingVolunteerApplications = pendingAppsRes.count ?? 0;
  const pendingAssistanceRequests = pendingAssistanceRes.count ?? 0;
  const pendingDonationProofs = pendingProofsRes.count ?? 0;
  const openSponsorshipRequests = openSponsorRequestsRes.count ?? 0;

  return {
    totalUsers: profilesRes.count ?? 0,
    activeUsers: activeUsersRes.count ?? 0,
    pendingUsers: pendingUsersRes.count ?? 0,
    activeCampaigns: campaignsRes.count ?? 0,
    totalDonationAmount,
    donationCount: donationRows.length,
    volunteerApplications: applicationsRes.count ?? 0,
    pendingVolunteerApplications,
    sponsors: sponsorsRes.count ?? 0,
    beneficiaryRequests: assistanceRes.count ?? 0,
    pendingAssistanceRequests,
    pendingDonationProofs,
    openSponsorshipRequests,
    events: eventsRes.count ?? 0,
    pendingReviews: pendingVolunteerApplications + pendingAssistanceRequests + pendingDonationProofs + openSponsorshipRequests,
  };
}

export async function fetchProfiles(): Promise<ProfileRow[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("profiles")
    .select("id, role, full_name, email, phone_number, account_status, invited_by, invited_at, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseError("fetchProfiles", error);
    throw error;
  }
  return data ?? [];
}

export async function updateProfileAccountStatus(userId: string, accountStatus: ProfileRow["account_status"]): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("profiles").update({ account_status: accountStatus }).eq("id", userId);
  if (error) {
    logSupabaseError("updateProfileAccountStatus", error);
    throw error;
  }
}

export async function fetchEvents(): Promise<EventRow[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("events")
    .select("id, admin_id, campaign_id, title, description, location, event_date, status, created_at, updated_at")
    .order("event_date", { ascending: true });

  if (error) {
    logSupabaseError("fetchEvents", error);
    throw error;
  }
  return data ?? [];
}

export async function createEvent(payload: TablesInsert<"events">): Promise<EventRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client
    .from("events")
    .insert(payload)
    .select("id, admin_id, campaign_id, title, description, location, event_date, status, created_at, updated_at")
    .single();
  if (error) {
    logSupabaseError("createEvent", error);
    throw error;
  }
  return data;
}

export async function updateEvent(id: string, values: TablesUpdate<"events">): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("events").update(values).eq("id", id);
  if (error) {
    logSupabaseError("updateEvent", error);
    throw error;
  }
}

export async function fetchReports(): Promise<ReportRow[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("reports")
    .select("id, admin_id, report_name, generated_at, report_type, status, metadata, file_path")
    .order("generated_at", { ascending: false });

  if (error) {
    logSupabaseError("fetchReports", error);
    throw error;
  }
  return data ?? [];
}

export async function createReport(payload: TablesInsert<"reports">): Promise<ReportRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client
    .from("reports")
    .insert(payload)
    .select("id, admin_id, report_name, generated_at, report_type, status, metadata, file_path")
    .single();
  if (error) {
    logSupabaseError("createReport", error);
    throw error;
  }
  return data;
}
