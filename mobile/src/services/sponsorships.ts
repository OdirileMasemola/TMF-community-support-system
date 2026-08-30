import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";

export type SponsorshipRow = Tables<"sponsorships">;
export type SponsorshipRequestRow = Tables<"sponsorship_requests">;
export type SponsorshipResponseRow = Tables<"sponsorship_request_responses">;

export type SponsorshipWithCampaign = SponsorshipRow & {
  campaigns: Pick<Tables<"campaigns">, "id" | "title" | "category" | "status" | "image_url" | "funding_goal" | "amount_raised" | "start_date" | "end_date"> | null;
};

export type SponsorshipWithSponsor = SponsorshipRow & {
  campaigns: Pick<Tables<"campaigns">, "id" | "title"> | null;
  sponsor_profiles:
    | (Pick<Tables<"sponsor_profiles">, "id" | "organisation_name" | "sponsorship_type" | "sponsor_level"> & {
        profiles: Pick<Tables<"profiles">, "email"> | null;
      })
    | null;
};

export type SponsorshipRequestWithCampaign = SponsorshipRequestRow & {
  campaigns: Pick<Tables<"campaigns">, "id" | "title"> | null;
};

export async function fetchSponsorSponsorships(sponsorProfileId: string): Promise<SponsorshipWithCampaign[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("sponsorships")
    .select(
      "id, sponsor_id, campaign_id, amount, sponsorship_date, sponsorship_type, status, campaigns(id, title, category, status, image_url, funding_goal, amount_raised, start_date, end_date)",
    )
    .eq("sponsor_id", sponsorProfileId)
    .order("sponsorship_date", { ascending: false });

  if (error) {
    logSupabaseError("fetchSponsorSponsorships", error);
    throw error;
  }
  return (data ?? []) as unknown as SponsorshipWithCampaign[];
}

export async function fetchAllSponsorships(limit = 100): Promise<SponsorshipWithSponsor[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("sponsorships")
    .select(
      "id, sponsor_id, campaign_id, amount, sponsorship_date, sponsorship_type, status, campaigns(id, title), sponsor_profiles(id, organisation_name, sponsorship_type, sponsor_level, profiles(email))",
    )
    .order("sponsorship_date", { ascending: false })
    .limit(limit);

  if (error) {
    logSupabaseError("fetchAllSponsorships", error);
    throw error;
  }
  return (data ?? []) as unknown as SponsorshipWithSponsor[];
}

export async function createSponsorship(payload: TablesInsert<"sponsorships">): Promise<SponsorshipRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client
    .from("sponsorships")
    .insert(payload)
    .select("id, sponsor_id, campaign_id, amount, sponsorship_date, sponsorship_type, status")
    .single();
  if (error) {
    logSupabaseError("createSponsorship", error);
    throw error;
  }
  return data;
}

export async function updateSponsorship(id: string, values: TablesUpdate<"sponsorships">): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("sponsorships").update(values).eq("id", id);
  if (error) {
    logSupabaseError("updateSponsorship", error);
    throw error;
  }
}

export async function fetchOpenSponsorshipRequests(): Promise<SponsorshipRequestWithCampaign[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("sponsorship_requests")
    .select(
      "id, campaign_id, title, requested_support, category, priority, deadline, estimated_impact, status, created_by, created_at, campaigns(id, title)",
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseError("fetchOpenSponsorshipRequests", error);
    throw error;
  }
  return (data ?? []) as unknown as SponsorshipRequestWithCampaign[];
}

export async function fetchAllSponsorshipRequests(): Promise<SponsorshipRequestWithCampaign[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("sponsorship_requests")
    .select(
      "id, campaign_id, title, requested_support, category, priority, deadline, estimated_impact, status, created_by, created_at, campaigns(id, title)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseError("fetchAllSponsorshipRequests", error);
    throw error;
  }
  return (data ?? []) as unknown as SponsorshipRequestWithCampaign[];
}

export async function createSponsorshipRequest(payload: TablesInsert<"sponsorship_requests">): Promise<SponsorshipRequestRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client
    .from("sponsorship_requests")
    .insert(payload)
    .select("id, campaign_id, title, requested_support, category, priority, deadline, estimated_impact, status, created_by, created_at")
    .single();
  if (error) {
    logSupabaseError("createSponsorshipRequest", error);
    throw error;
  }
  return data;
}

export async function fetchSponsorResponses(sponsorProfileId: string): Promise<SponsorshipResponseRow[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("sponsorship_request_responses")
    .select("id, request_id, sponsor_id, sponsorship_id, status, notes, responded_at")
    .eq("sponsor_id", sponsorProfileId)
    .order("responded_at", { ascending: false });

  if (error) {
    logSupabaseError("fetchSponsorResponses", error);
    throw error;
  }
  return data ?? [];
}

export async function createSponsorshipResponse(payload: TablesInsert<"sponsorship_request_responses">): Promise<SponsorshipResponseRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client
    .from("sponsorship_request_responses")
    .insert(payload)
    .select("id, request_id, sponsor_id, sponsorship_id, status, notes, responded_at")
    .single();
  if (error) {
    logSupabaseError("createSponsorshipResponse", error);
    throw error;
  }
  return data;
}
