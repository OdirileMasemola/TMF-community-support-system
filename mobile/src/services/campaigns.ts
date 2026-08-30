import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";

export type CampaignRow = Tables<"campaigns">;

const campaignColumns =
  "id, admin_id, title, description, location, start_date, end_date, status, category, image_url, funding_goal, amount_raised, is_public, created_at, updated_at";

export async function fetchCampaigns(options?: {
  publicOnly?: boolean;
  status?: Tables<"campaigns">["status"] | Tables<"campaigns">["status"][];
  limit?: number;
}): Promise<CampaignRow[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  let query = client.from("campaigns").select(campaignColumns).order("created_at", { ascending: false });

  if (options?.publicOnly) {
    query = query.eq("is_public", true).eq("status", "active");
  }

  if (options?.status) {
    if (Array.isArray(options.status)) {
      query = query.in("status", options.status);
    } else {
      query = query.eq("status", options.status);
    }
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) {
    logSupabaseError("fetchCampaigns", error);
    throw error;
  }
  return data ?? [];
}

export async function fetchCampaignById(id: string): Promise<CampaignRow | null> {
  const client = getSupabaseClientOrNull();
  if (!client) return null;
  const { data, error } = await client.from("campaigns").select(campaignColumns).eq("id", id).maybeSingle();
  if (error) {
    logSupabaseError("fetchCampaignById", error);
    throw error;
  }
  return data;
}

export async function createCampaign(payload: TablesInsert<"campaigns">): Promise<CampaignRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client.from("campaigns").insert(payload).select(campaignColumns).single();
  if (error) {
    logSupabaseError("createCampaign", error);
    throw error;
  }
  return data;
}

export async function updateCampaign(id: string, values: TablesUpdate<"campaigns">): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("campaigns").update(values).eq("id", id);
  if (error) {
    logSupabaseError("updateCampaign", error);
    throw error;
  }
}
