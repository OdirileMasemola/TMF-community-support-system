import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../errors/ApiError.js';
import type { UserId } from '../types/auth.types.js';
import { toApiError } from './errors.js';

/**
 * Role-specific profile tables. Their `id` is NOT the auth user id: rows are linked to
 * `public.profiles` through `user_id`, and the business tables reference the role profile `id`
 * (e.g. donations.donor_id -> donor_profiles.id).
 */
export const ROLE_PROFILE_TABLES = {
  administrator: 'administrator_profiles',
  donor: 'donor_profiles',
  beneficiary: 'beneficiary_profiles',
  volunteer: 'volunteer_profiles',
  sponsor: 'sponsor_profiles',
} as const;
export type RoleProfileRole = keyof typeof ROLE_PROFILE_TABLES;

const LABELS: Record<RoleProfileRole, string> = {
  administrator: 'Administrator',
  donor: 'Donor',
  beneficiary: 'Beneficiary',
  volunteer: 'Volunteer',
  sponsor: 'Sponsor',
};

/**
 * Returns the caller's role profile id (e.g. donor_profiles.id), looked up as the caller (RLS:
 * "Users manage own ... profile" / "Admins manage admin profiles"), the same way campaigns resolves
 * admin_id. Never taken from the request. Throws 403 when the caller has no such profile.
 */
export async function requireRoleProfileId(
  client: SupabaseClient,
  role: RoleProfileRole,
  userId: UserId,
): Promise<string> {
  const { data, error, status } = await client
    .from(ROLE_PROFILE_TABLES[role])
    .select('id')
    .eq('user_id', userId)
    .maybeSingle<{ id: string }>()
    .retry(false);
  if (error !== null) throw toApiError(error, status, 'load', `${role} profile`);
  if (data === null) throw ApiError.forbidden(`${LABELS[role]} profile not found`);
  return data.id;
}
