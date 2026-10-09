import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { apiData, apiList } from "@/lib/apiClient";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";

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

const requestColumns = "/api/v1/sponsorship-requests";

export async function fetchSponsorSponsorships(sponsorProfileId: string): Promise<SponsorshipWithCampaign[]> {
  if (!getSupabaseClientOrNull() || !sponsorProfileId) return [];
  return apiList<SponsorshipWithCampaign>("/api/v1/sponsorships/me");
}

export async function fetchAllSponsorships(limit = 100): Promise<SponsorshipWithSponsor[]> {
  if (!getSupabaseClientOrNull()) return [];
  return apiList<SponsorshipWithSponsor>("/api/v1/sponsorships", undefined, limit);
}

export async function createSponsorship(payload: TablesInsert<"sponsorships">): Promise<SponsorshipRow> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  const body: Record<string, unknown> = { amount: payload.amount };
  if (payload.campaign_id !== undefined) body.campaign_id = payload.campaign_id;
  if (payload.sponsorship_type !== undefined) body.sponsorship_type = payload.sponsorship_type;
  return apiData<SponsorshipRow>("/api/v1/sponsorships", { method: "POST", body });
}

export async function updateSponsorship(id: string, values: TablesUpdate<"sponsorships">): Promise<void> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  const body: Record<string, unknown> = {};
  if (values.amount !== undefined) body.amount = values.amount;
  if (values.campaign_id !== undefined) body.campaign_id = values.campaign_id;
  if (values.sponsorship_type !== undefined) body.sponsorship_type = values.sponsorship_type;
  if (values.status !== undefined) body.status = values.status;
  if (values.sponsorship_date !== undefined) body.sponsorship_date = values.sponsorship_date;
  if (Object.keys(body).length === 0) throw new Error("At least one sponsorship field is required.");
  await apiData(`/api/v1/sponsorships/${id}`, { method: "PATCH", body });
}

export async function fetchOpenSponsorshipRequests(): Promise<SponsorshipRequestWithCampaign[]> {
  if (!getSupabaseClientOrNull()) return [];
  return apiList<SponsorshipRequestWithCampaign>(requestColumns, { status: "open" });
}

export async function fetchAllSponsorshipRequests(): Promise<SponsorshipRequestWithCampaign[]> {
  if (!getSupabaseClientOrNull()) return [];
  return apiList<SponsorshipRequestWithCampaign>(requestColumns);
}

export async function createSponsorshipRequest(payload: TablesInsert<"sponsorship_requests">): Promise<SponsorshipRequestRow> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  const body: Record<string, unknown> = {
    title: payload.title,
    requested_support: payload.requested_support,
  };
  if (payload.campaign_id !== undefined) body.campaign_id = payload.campaign_id;
  if (payload.category !== undefined) body.category = payload.category;
  if (payload.priority !== undefined) body.priority = payload.priority;
  if (payload.deadline !== undefined) body.deadline = payload.deadline;
  if (payload.estimated_impact !== undefined) body.estimated_impact = payload.estimated_impact;
  if (payload.status !== undefined) body.status = payload.status;
  return apiData<SponsorshipRequestRow>("/api/v1/sponsorship-requests", { method: "POST", body });
}

export async function updateSponsorshipRequest(id: string, values: TablesUpdate<"sponsorship_requests">): Promise<void> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  const body: Record<string, unknown> = {};
  if (values.title !== undefined) body.title = values.title;
  if (values.requested_support !== undefined) body.requested_support = values.requested_support;
  if (values.campaign_id !== undefined) body.campaign_id = values.campaign_id;
  if (values.category !== undefined) body.category = values.category;
  if (values.priority !== undefined) body.priority = values.priority;
  if (values.deadline !== undefined) body.deadline = values.deadline;
  if (values.estimated_impact !== undefined) body.estimated_impact = values.estimated_impact;
  if (values.status !== undefined) body.status = values.status;
  if (Object.keys(body).length === 0) throw new Error("At least one sponsorship request field is required.");
  await apiData(`/api/v1/sponsorship-requests/${id}`, { method: "PATCH", body });
}

export async function fetchSponsorResponses(sponsorProfileId: string): Promise<SponsorshipResponseRow[]> {
  if (!getSupabaseClientOrNull() || !sponsorProfileId) return [];
  return apiList<SponsorshipResponseRow>("/api/v1/sponsorship-request-responses/me");
}

export async function createSponsorshipResponse(payload: TablesInsert<"sponsorship_request_responses">): Promise<SponsorshipResponseRow> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  const body: Record<string, unknown> = {};
  if (payload.notes !== undefined) body.notes = payload.notes;
  if (payload.sponsorship_id) body.sponsorship_id = payload.sponsorship_id;
  return apiData<SponsorshipResponseRow>(`/api/v1/sponsorship-requests/${payload.request_id}/responses`, {
    method: "POST",
    body,
  });
}
