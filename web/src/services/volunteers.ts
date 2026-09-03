import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";

export type CampaignApplicationRow = Tables<"campaign_applications">;
export type VolunteerAssignmentRow = Tables<"volunteer_assignments">;
export type VolunteerHoursRow = Tables<"volunteer_hours">;

export type ApplicationWithCampaign = CampaignApplicationRow & {
  campaigns: Pick<Tables<"campaigns">, "id" | "title" | "category" | "location" | "status"> | null;
};

export type AssignmentWithCampaign = VolunteerAssignmentRow & {
  campaigns: Pick<Tables<"campaigns">, "id" | "title" | "category" | "location" | "image_url"> | null;
};

export type ApplicationWithVolunteer = CampaignApplicationRow & {
  campaigns: Pick<Tables<"campaigns">, "id" | "title"> | null;
  volunteer_profiles:
    | (Pick<Tables<"volunteer_profiles">, "id" | "user_id"> & {
        profiles: Pick<Tables<"profiles">, "full_name" | "email"> | null;
      })
    | null;
};

export async function fetchVolunteerApplications(volunteerProfileId: string): Promise<ApplicationWithCampaign[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("campaign_applications")
    .select("id, volunteer_id, campaign_id, application_date, status, participation_role, campaigns(id, title, category, location, status)")
    .eq("volunteer_id", volunteerProfileId)
    .order("application_date", { ascending: false });

  if (error) {
    logSupabaseError("fetchVolunteerApplications", error);
    throw error;
  }
  return (data ?? []) as unknown as ApplicationWithCampaign[];
}

export async function fetchAllApplications(limit = 100): Promise<ApplicationWithVolunteer[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("campaign_applications")
    .select(
      "id, volunteer_id, campaign_id, application_date, status, participation_role, campaigns(id, title), volunteer_profiles(id, user_id, profiles(full_name, email))",
    )
    .order("application_date", { ascending: false })
    .limit(limit);

  if (error) {
    logSupabaseError("fetchAllApplications", error);
    throw error;
  }
  return (data ?? []) as unknown as ApplicationWithVolunteer[];
}

export async function createCampaignApplication(payload: TablesInsert<"campaign_applications">): Promise<CampaignApplicationRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");

  const { data, error } = await client
    .from("campaign_applications")
    .insert(payload)
    .select("id, volunteer_id, campaign_id, application_date, status, participation_role")
    .single();

  if (error) {
    logSupabaseError("createCampaignApplication", error);
    throw error;
  }
  return data;
}

export async function updateCampaignApplication(id: string, values: TablesUpdate<"campaign_applications">): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("campaign_applications").update(values).eq("id", id);
  if (error) {
    logSupabaseError("updateCampaignApplication", error);
    throw error;
  }
}

export async function fetchVolunteerAssignments(volunteerProfileId: string): Promise<AssignmentWithCampaign[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("volunteer_assignments")
    .select(
      "id, application_id, volunteer_id, campaign_id, role, location, schedule, start_date, end_date, status, created_at, campaigns(id, title, category, location, image_url)",
    )
    .eq("volunteer_id", volunteerProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseError("fetchVolunteerAssignments", error);
    throw error;
  }
  return (data ?? []) as unknown as AssignmentWithCampaign[];
}

export async function createVolunteerAssignment(payload: TablesInsert<"volunteer_assignments">): Promise<VolunteerAssignmentRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client
    .from("volunteer_assignments")
    .insert(payload)
    .select("id, application_id, volunteer_id, campaign_id, role, location, schedule, start_date, end_date, status, created_at")
    .single();
  if (error) {
    logSupabaseError("createVolunteerAssignment", error);
    throw error;
  }
  return data;
}

export async function updateVolunteerAssignment(id: string, values: TablesUpdate<"volunteer_assignments">): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("volunteer_assignments").update(values).eq("id", id);
  if (error) {
    logSupabaseError("updateVolunteerAssignment", error);
    throw error;
  }
}

export async function fetchVolunteerHours(volunteerProfileId: string): Promise<VolunteerHoursRow[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("volunteer_hours")
    .select("id, assignment_id, volunteer_id, hours, work_date, notes, recorded_at")
    .eq("volunteer_id", volunteerProfileId)
    .order("work_date", { ascending: false });

  if (error) {
    logSupabaseError("fetchVolunteerHours", error);
    throw error;
  }
  return data ?? [];
}

export async function createVolunteerHours(payload: TablesInsert<"volunteer_hours">): Promise<VolunteerHoursRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client
    .from("volunteer_hours")
    .insert(payload)
    .select("id, assignment_id, volunteer_id, hours, work_date, notes, recorded_at")
    .single();
  if (error) {
    logSupabaseError("createVolunteerHours", error);
    throw error;
  }
  return data;
}
