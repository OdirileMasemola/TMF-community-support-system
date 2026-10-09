import type { UserRole } from "@/types/app.types";
import type { Tables } from "@/types/database.types";
import { apiData, isApiError } from "@/lib/apiClient";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";

export type ProfileRow = Tables<"profiles">;
export type AdministratorProfile = Tables<"administrator_profiles">;
export type VolunteerProfile = Tables<"volunteer_profiles">;
export type BeneficiaryProfile = Tables<"beneficiary_profiles">;
export type DonorProfile = Tables<"donor_profiles">;
export type SponsorProfile = Tables<"sponsor_profiles">;

type MeProfile = Omit<ProfileRow, "avatar_change_count"> & { avatar_change_count?: number };

type MeResponse = {
  profile: MeProfile;
  role_profile: Record<string, unknown> | null;
};

const ROLE_FIELDS = {
  donor: ["donation_preference", "avatar_url"],
  beneficiary: ["residential_address", "assistance_type", "avatar_url"],
  volunteer: ["residential_address", "availability_status", "preferred_area", "avatar_url"],
  sponsor: ["organisation_name", "sponsorship_type", "representative_name", "business_address", "logo_url"],
} as const;

function toProfileRow(profile: MeProfile): ProfileRow {
  return { ...profile, avatar_change_count: profile.avatar_change_count ?? 0 };
}

async function loadMe(): Promise<MeResponse | null> {
  try {
    return await apiData<MeResponse>("/api/v1/me");
  } catch (error) {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  }
}

async function readRoleProfile<T>(userId: string, role: UserRole): Promise<T | null> {
  if (!getSupabaseClientOrNull()) return null;
  const me = await loadMe();
  if (!me || me.profile.id !== userId || me.profile.role !== role || !me.role_profile) return null;
  return me.role_profile as T;
}

async function updateRoleProfile(values: object, allowed: readonly string[]): Promise<void> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");

  const source = values as Record<string, string | null | undefined>;
  const roleProfile: Record<string, string | null> = {};
  for (const field of allowed) {
    if (source[field] === undefined) continue;
    if (field === "organisation_name" && !source[field]?.trim()) {
      throw new Error("Organisation name is required.");
    }
    const value = source[field];
    roleProfile[field] = typeof value === "string" && value.trim() === "" ? null : (value ?? null);
  }

  if (Object.keys(roleProfile).length === 0) {
    if (Object.values(source).some((value) => value !== undefined)) {
      throw new Error("This profile change is not available on the API.");
    }
    return;
  }

  await apiData("/api/v1/me", { method: "PATCH", body: { role_profile: roleProfile } });
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  if (!getSupabaseClientOrNull()) return null;
  const me = await loadMe();
  if (!me || me.profile.id !== userId) return null;
  return toProfileRow(me.profile);
}

export async function ensureRoleProfile(userId: string, role: UserRole, organisationName?: string): Promise<void> {
  if (!getSupabaseClientOrNull()) return;
  if (!userId) return;

  if (role === "administrator") {
    throw new Error("Administrator profiles cannot be created from the application.");
  }

  const body: { role: UserRole; organisation_name?: string } = { role };
  if (role === "sponsor") body.organisation_name = organisationName?.trim() || "Organisation";

  try {
    await apiData("/api/v1/me/profile", { method: "POST", body });
  } catch (error) {
    if (isApiError(error) && error.status === 409) return;
    throw error;
  }
}

export async function fetchAdministratorProfile(userId: string): Promise<AdministratorProfile | null> {
  return readRoleProfile<AdministratorProfile>(userId, "administrator");
}

export async function fetchVolunteerProfile(userId: string): Promise<VolunteerProfile | null> {
  return readRoleProfile<VolunteerProfile>(userId, "volunteer");
}

export async function fetchBeneficiaryProfile(userId: string): Promise<BeneficiaryProfile | null> {
  return readRoleProfile<BeneficiaryProfile>(userId, "beneficiary");
}

export async function fetchDonorProfile(userId: string): Promise<DonorProfile | null> {
  return readRoleProfile<DonorProfile>(userId, "donor");
}

export async function fetchSponsorProfile(userId: string): Promise<SponsorProfile | null> {
  return readRoleProfile<SponsorProfile>(userId, "sponsor");
}

export async function updateProfile(
  userId: string,
  values: Partial<Pick<ProfileRow, "full_name" | "phone_number" | "avatar_url">>,
): Promise<void> {
  if (!getSupabaseClientOrNull()) throw new Error("Supabase is not configured.");
  if (!userId) throw new Error("You must be signed in.");

  const body: { full_name?: string; phone_number?: string | null; avatar_url?: string | null } = {};
  if (values.full_name !== undefined) body.full_name = values.full_name;
  if (values.phone_number !== undefined) body.phone_number = values.phone_number;
  if (values.avatar_url !== undefined) {
    const avatarUrl: string | null = values.avatar_url;
    body.avatar_url = avatarUrl;
  }
  if (Object.keys(body).length === 0) return;

  await apiData("/api/v1/me", { method: "PATCH", body });
}

export async function updateVolunteerProfile(
  profileId: string,
  values: Partial<Pick<VolunteerProfile, "residential_address" | "availability_status" | "preferred_area" | "avatar_url">>,
): Promise<void> {
  if (!profileId) throw new Error("Volunteer profile not found.");
  await updateRoleProfile(values, ROLE_FIELDS.volunteer);
}

export async function updateBeneficiaryProfile(
  profileId: string,
  values: Partial<Pick<BeneficiaryProfile, "residential_address" | "assistance_type" | "avatar_url" | "eligibility_status">>,
): Promise<void> {
  if (!profileId) throw new Error("Beneficiary profile not found.");
  await updateRoleProfile(values, ROLE_FIELDS.beneficiary);
}

export async function updateDonorProfile(
  profileId: string,
  values: Partial<Pick<DonorProfile, "donation_preference" | "avatar_url" | "member_since">>,
): Promise<void> {
  if (!profileId) throw new Error("Donor profile not found.");
  await updateRoleProfile(values, ROLE_FIELDS.donor);
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
  if (!profileId) throw new Error("Sponsor profile not found.");
  await updateRoleProfile(values, ROLE_FIELDS.sponsor);
}
