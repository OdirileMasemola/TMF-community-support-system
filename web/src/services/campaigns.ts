import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { apiData, apiList, isApiError } from "@/lib/apiClient";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";

export type CampaignRow = Tables<"campaigns">;

const WRITABLE = [
  "title",
  "description",
  "location",
  "start_date",
  "end_date",
  "status",
  "category",
  "image_url",
  "funding_goal",
  "is_public",
] as const;

function writableBody(values: object): Record<string, unknown> {
  const source = values as Record<string, unknown>;
  const body: Record<string, unknown> = {};
  for (const field of WRITABLE) {
    if (source[field] !== undefined) body[field] = source[field];
  }
  return body;
}

export async function fetchCampaigns(options?: {
  publicOnly?: boolean;
  status?: Tables<"campaigns">["status"] | Tables<"campaigns">["status"][];
  limit?: number;
}): Promise<CampaignRow[]> {
  if (!getSupabaseClientOrNull()) return [];

  const rows = await apiList<CampaignRow>("/api/v1/campaigns");
  const statuses = options?.status === undefined ? null : Array.isArray(options.status) ? options.status : [options.status];
  const filtered = rows.filter((campaign) => {
    if (options?.publicOnly && (!campaign.is_public || campaign.status !== "active")) return false;
    if (statuses && !statuses.includes(campaign.status)) return false;
    return true;
  });

  const limit = options?.limit ?? (options?.publicOnly ? 48 : undefined);
  return limit ? filtered.slice(0, limit) : filtered;
}

export async function fetchCampaignById(id: string): Promise<CampaignRow | null> {
  if (!getSupabaseClientOrNull()) return null;
  try {
    return await apiData<CampaignRow>(`/api/v1/campaigns/${id}`);
  } catch (error) {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  }
}

export async function createCampaign(payload: TablesInsert<"campaigns">): Promise<CampaignRow> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  return apiData<CampaignRow>("/api/v1/campaigns", { method: "POST", body: writableBody(payload) });
}

export async function updateCampaign(id: string, values: TablesUpdate<"campaigns">): Promise<void> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  const body = writableBody(values);
  if (Object.keys(body).length === 0) throw new Error("At least one campaign field is required.");
  await apiData(`/api/v1/campaigns/${id}`, { method: "PATCH", body });
}
