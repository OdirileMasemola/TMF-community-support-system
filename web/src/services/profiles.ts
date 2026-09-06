import type { UserRole } from "@/types/app.types";
import type { Tables } from "@/types/database.types";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";

export type ProfileRow = Tables<"profiles">;
export type AdministratorProfile = Tables<"administrator_profiles">;
export type VolunteerProfile = Tables<"volunteer_profiles">;
export type BeneficiaryProfile = Tables<"beneficiary_profiles">;
export type DonorProfile = Tables<"donor_profiles">;
export type SponsorProfile = Tables<"sponsor_profiles">;

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const client = getSupabaseClientOrNull();
  if (!client) return null;

  const { data, error } = await client
    .from("profiles")
    .select("id, role, full_name, email, phone_number, account_status, invited_by, invited_at, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    logSupabaseError("fetchProfile", error);
    throw error;
  }

  return data;
}

export async function ensureRoleProfile(userId: string, role: UserRole, organisationName?: string): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) return;

  if (role === "administrator") {
    throw new Error("Administrator profiles cannot be created from the application.");
  }

  if (role === "volunteer") {
    const { error } = await client
      .from("volunteer_profiles")
      .upsert({ user_id: userId, member_since: new Date().toISOString().slice(0, 10) }, { onConflict: "user_id" });
    if (error) {
      logSupabaseError("ensureRoleProfile.volunteer", error);
      throw error;
    }
    return;
  }

  if (role === "beneficiary") {
    const { error } = await client.from("beneficiary_profiles").upsert({ user_id: userId }, { onConflict: "user_id" });
    if (error) {
      logSupabaseError("ensureRoleProfile.beneficiary", error);
      throw error;
    }
    return;
  }

  if (role === "donor") {
    const { error } = await client
      .from("donor_profiles")
      .upsert({ user_id: userId, member_since: new Date().toISOString().slice(0, 10) }, { onConflict: "user_id" });
    if (error) {
      logSupabaseError("ensureRoleProfile.donor", error);
      throw error;
    }
    return;
  }

  if (role === "sponsor") {
    const { error } = await client.from("sponsor_profiles").upsert(
      {
        user_id: userId,
        organisation_name: organisationName?.trim() || "Organisation",
      },
      { onConflict: "user_id" },
    );
    if (error) {
      logSupabaseError("ensureRoleProfile.sponsor", error);
      throw error;
    }
  }
}

export async function fetchAdministratorProfile(userId: string): Promise<AdministratorProfile | null> {
  const client = getSupabaseClientOrNull();
  if (!client) return null;
  const { data, error } = await client.from("administrator_profiles").select("id, user_id, created_at").eq("user_id", userId).maybeSingle();
  if (error) {
    logSupabaseError("fetchAdministratorProfile", error);
    throw error;
  }
  return data;
}

export async function fetchVolunteerProfile(userId: string): Promise<VolunteerProfile | null> {
  const client = getSupabaseClientOrNull();
  if (!client) return null;
  const { data, error } = await client
    .from("volunteer_profiles")
    .select("id, user_id, residential_address, availability_status, preferred_area, member_since, status, avatar_url, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    logSupabaseError("fetchVolunteerProfile", error);
    throw error;
  }
  return data;
}

export async function fetchBeneficiaryProfile(userId: string): Promise<BeneficiaryProfile | null> {
  const client = getSupabaseClientOrNull();
  if (!client) return null;
  const { data, error } = await client
    .from("beneficiary_profiles")
    .select("id, user_id, residential_address, assistance_type, avatar_url, eligibility_status, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    logSupabaseError("fetchBeneficiaryProfile", error);
    throw error;
  }
  return data;
}

export async function fetchDonorProfile(userId: string): Promise<DonorProfile | null> {
  const client = getSupabaseClientOrNull();
  if (!client) return null;
  const { data, error } = await client
    .from("donor_profiles")
    .select("id, user_id, donation_preference, avatar_url, member_since, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    logSupabaseError("fetchDonorProfile", error);
    throw error;
  }
  return data;
}

export async function fetchSponsorProfile(userId: string): Promise<SponsorProfile | null> {
  const client = getSupabaseClientOrNull();
  if (!client) return null;
  const { data, error } = await client
    .from("sponsor_profiles")
    .select(
      "id, user_id, organisation_name, sponsorship_type, representative_name, business_address, sponsor_level, logo_url, created_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    logSupabaseError("fetchSponsorProfile", error);
    throw error;
  }
  return data;
}

export async function updateProfile(
  userId: string,
  values: Partial<Pick<ProfileRow, "full_name" | "phone_number">>,
): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("profiles").update(values).eq("id", userId);
  if (error) {
    logSupabaseError("updateProfile", error);
    throw error;
  }
}

export async function updateVolunteerProfile(
  profileId: string,
  values: Partial<Pick<VolunteerProfile, "residential_address" | "availability_status" | "preferred_area" | "avatar_url">>,
): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("volunteer_profiles").update(values).eq("id", profileId);
  if (error) {
    logSupabaseError("updateVolunteerProfile", error);
    throw error;
  }
}

export async function updateBeneficiaryProfile(
  profileId: string,
  values: Partial<Pick<BeneficiaryProfile, "residential_address" | "assistance_type" | "avatar_url">>,
): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("beneficiary_profiles").update(values).eq("id", profileId);
  if (error) {
    logSupabaseError("updateBeneficiaryProfile", error);
    throw error;
  }
}

export async function updateDonorProfile(
  profileId: string,
  values: Partial<Pick<DonorProfile, "donation_preference" | "avatar_url" | "member_since">>,
): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("donor_profiles").update(values).eq("id", profileId);
  if (error) {
    logSupabaseError("updateDonorProfile", error);
    throw error;
  }
}

export async function updateSponsorProfile(
  profileId: string,
  values: Partial<
    Pick<
      SponsorProfile,
      "organisation_name" | "sponsorship_type" | "representative_name" | "business_address" | "sponsor_level" | "logo_url"
    >
  >,
): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("sponsor_profiles").update(values).eq("id", profileId);
  if (error) {
    logSupabaseError("updateSponsorProfile", error);
    throw error;
  }
}
