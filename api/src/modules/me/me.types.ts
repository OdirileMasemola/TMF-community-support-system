/**
 * Types for the caller's own profile and settings. Field names are the column names of
 * public.profiles, the role profile tables and public.user_settings (snake_case), the same shape
 * web/ and mobile/ use.
 */
import type { UserRole } from '../../shared/types/auth.types.js';

/** Columns of public.profiles returned by /me (avatar_change_count is internal and not returned). */
export const PROFILE_COLUMNS =
  'id, role, full_name, email, phone_number, account_status, avatar_url, invited_by, invited_at, created_at, updated_at';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone_number: string | null;
  account_status: string;
  avatar_url: string | null;
  invited_by: string | null;
  invited_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Columns returned for each role profile table (same lists as web/mobile services/profiles.ts). */
export const ROLE_PROFILE_COLUMNS: Record<UserRole, string> = {
  administrator: 'id, user_id, created_at',
  donor: 'id, user_id, donation_preference, avatar_url, member_since, created_at',
  beneficiary: 'id, user_id, residential_address, assistance_type, avatar_url, eligibility_status, created_at',
  volunteer:
    'id, user_id, residential_address, availability_status, preferred_area, member_since, status, avatar_url, created_at',
  sponsor:
    'id, user_id, organisation_name, sponsorship_type, representative_name, business_address, sponsor_level, logo_url, created_at',
};

/** A row of the caller's role profile table; which fields exist depends on the role. */
export type RoleProfile = { id: string; user_id: string; created_at: string } & Record<string, unknown>;

/**
 * Role profile fields the owner may change through PATCH /me. Status-like fields that the
 * foundation decides (beneficiary eligibility_status, volunteer status, sponsor sponsor_level,
 * member_since) are not accepted, even though RLS would let the owner write them.
 */
export const ROLE_PROFILE_WRITABLE_FIELDS: Record<UserRole, readonly string[]> = {
  administrator: [],
  donor: ['donation_preference', 'avatar_url'],
  beneficiary: ['residential_address', 'assistance_type', 'avatar_url'],
  volunteer: ['residential_address', 'availability_status', 'preferred_area', 'avatar_url'],
  sponsor: ['organisation_name', 'sponsorship_type', 'representative_name', 'business_address', 'logo_url'],
};

export interface Me {
  profile: Profile;
  /** null when the role profile row does not exist yet (see POST /me/profile). */
  role_profile: RoleProfile | null;
}

export interface UpdateMeBody {
  full_name?: string;
  phone_number?: string | null;
  /** public.profiles.avatar_url. The database counts each change (avatar_change_count, max 3). */
  avatar_url?: string | null;
  role_profile?: Record<string, string | null>;
}

/** Roles a user can pick for themselves. Administrator is never self-assigned. */
export const SELF_SERVICE_ROLES = ['donor', 'beneficiary', 'volunteer', 'sponsor'] as const;
export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];

export interface CompleteProfileBody {
  role: SelfServiceRole;
  full_name?: string;
  phone_number?: string | null;
  /** Sponsors only (sponsor_profiles.organisation_name is NOT NULL); defaults to the full name. */
  organisation_name?: string;
}

/** Values allowed by user_settings_theme_preference_check. */
export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const SETTINGS_COLUMNS =
  'user_id, theme_preference, notify_campaign_updates, notify_request_updates, notify_donation_updates, created_at, updated_at';

export interface UserSettings {
  user_id: string;
  theme_preference: ThemePreference;
  notify_campaign_updates: boolean;
  notify_request_updates: boolean;
  notify_donation_updates: boolean;
  created_at: string;
  updated_at: string;
}

export const SETTINGS_WRITABLE_FIELDS = [
  'theme_preference',
  'notify_campaign_updates',
  'notify_request_updates',
  'notify_donation_updates',
] as const;

export interface UpdateSettingsBody {
  theme_preference?: ThemePreference;
  notify_campaign_updates?: boolean;
  notify_request_updates?: boolean;
  notify_donation_updates?: boolean;
}
