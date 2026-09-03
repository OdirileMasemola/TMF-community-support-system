import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";

export type DonationRow = Tables<"donations">;
export type DonationProofRow = Tables<"donation_proofs">;

export type DonationWithCampaign = DonationRow & {
  campaigns: Pick<Tables<"campaigns">, "id" | "title" | "category" | "image_url"> | null;
};

export type DonationWithDonor = DonationRow & {
  donor_profiles:
    | (Pick<Tables<"donor_profiles">, "id" | "user_id"> & {
        profiles: Pick<Tables<"profiles">, "full_name" | "email"> | null;
      })
    | null;
  campaigns: Pick<Tables<"campaigns">, "id" | "title"> | null;
};

export type ProofWithDonation = DonationProofRow & {
  donations:
    | (Pick<DonationRow, "id" | "amount" | "payment_reference" | "donation_date" | "status"> & {
        campaigns: Pick<Tables<"campaigns">, "title"> | null;
      })
    | null;
};

const donationColumns =
  "id, donor_id, campaign_id, amount, donation_date, payment_method, status, receipt_number, donation_kind, item_description, item_quantity, payment_reference, notes";

export async function fetchDonorDonations(donorProfileId: string): Promise<DonationWithCampaign[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("donations")
    .select(`${donationColumns}, campaigns(id, title, category, image_url)`)
    .eq("donor_id", donorProfileId)
    .order("donation_date", { ascending: false });

  if (error) {
    logSupabaseError("fetchDonorDonations", error);
    throw error;
  }

  return (data ?? []) as unknown as DonationWithCampaign[];
}

export async function fetchAllDonations(limit = 100): Promise<DonationWithDonor[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("donations")
    .select(`${donationColumns}, campaigns(id, title), donor_profiles(id, user_id, profiles(full_name, email))`)
    .order("donation_date", { ascending: false })
    .limit(limit);

  if (error) {
    logSupabaseError("fetchAllDonations", error);
    throw error;
  }

  return (data ?? []) as unknown as DonationWithDonor[];
}

export async function createDonation(payload: TablesInsert<"donations">): Promise<DonationRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");

  const { data, error } = await client.from("donations").insert(payload).select(donationColumns).single();
  if (error) {
    logSupabaseError("createDonation", error);
    throw error;
  }
  return data;
}

export async function updateDonation(id: string, values: TablesUpdate<"donations">): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("donations").update(values).eq("id", id);
  if (error) {
    logSupabaseError("updateDonation", error);
    throw error;
  }
}

export async function fetchDonorProofs(donorProfileId: string): Promise<ProofWithDonation[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data: donations, error: donationsError } = await client.from("donations").select("id").eq("donor_id", donorProfileId);
  if (donationsError) {
    logSupabaseError("fetchDonorProofs.donations", donationsError);
    throw donationsError;
  }

  const donationIds = (donations ?? []).map((d) => d.id);
  if (donationIds.length === 0) return [];

  const { data, error } = await client
    .from("donation_proofs")
    .select(
      "id, donation_id, file_path, file_name, payment_reference, payment_date, admin_comment, verification_status, reviewed_by, reviewed_at, uploaded_at, donations(id, amount, payment_reference, donation_date, status, campaigns(title))",
    )
    .in("donation_id", donationIds)
    .order("uploaded_at", { ascending: false });

  if (error) {
    logSupabaseError("fetchDonorProofs", error);
    throw error;
  }

  return (data ?? []) as unknown as ProofWithDonation[];
}

export async function fetchPendingProofs(limit = 100): Promise<ProofWithDonation[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("donation_proofs")
    .select(
      "id, donation_id, file_path, file_name, payment_reference, payment_date, admin_comment, verification_status, reviewed_by, reviewed_at, uploaded_at, donations(id, amount, payment_reference, donation_date, status, campaigns(title))",
    )
    .eq("verification_status", "pending")
    .order("uploaded_at", { ascending: false })
    .limit(limit);

  if (error) {
    logSupabaseError("fetchPendingProofs", error);
    throw error;
  }

  return (data ?? []) as unknown as ProofWithDonation[];
}

export async function createDonationProof(payload: TablesInsert<"donation_proofs">): Promise<DonationProofRow> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");

  const { data, error } = await client
    .from("donation_proofs")
    .insert(payload)
    .select(
      "id, donation_id, file_path, file_name, payment_reference, payment_date, admin_comment, verification_status, reviewed_by, reviewed_at, uploaded_at",
    )
    .single();

  if (error) {
    logSupabaseError("createDonationProof", error);
    throw error;
  }
  return data;
}

export async function updateDonationProof(id: string, values: TablesUpdate<"donation_proofs">): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("donation_proofs").update(values).eq("id", id);
  if (error) {
    logSupabaseError("updateDonationProof", error);
    throw error;
  }
}
