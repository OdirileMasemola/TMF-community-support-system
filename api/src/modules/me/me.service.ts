import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { conflictError, toApiError, validationError } from '../../shared/supabase/errors.js';
import { ROLE_PROFILE_TABLES } from '../../shared/supabase/roleProfiles.js';
import type { AuthUser, UserId, UserRole } from '../../shared/types/auth.types.js';
import { todayInJohannesburg } from '../../shared/utils/dates.js';
import {
  PROFILE_COLUMNS,
  ROLE_PROFILE_COLUMNS,
  ROLE_PROFILE_WRITABLE_FIELDS,
  SETTINGS_COLUMNS,
  SETTINGS_WRITABLE_FIELDS,
  type CompleteProfileBody,
  type Me,
  type Profile,
  type RoleProfile,
  type UpdateMeBody,
  type UpdateSettingsBody,
  type UserSettings,
} from './me.types.js';

export interface MeServiceDeps {
  /** Creates a client that acts as the caller (their token is sent, so RLS applies). Never service-role. */
  createUserClient: (accessToken: string) => SupabaseClient;
}

export interface MeService {
  get(accessToken: string, user: AuthUser): Promise<Me>;
  update(accessToken: string, user: AuthUser, body: UpdateMeBody): Promise<Me>;
  completeProfile(accessToken: string, user: AuthUser, body: CompleteProfileBody): Promise<Me>;
  getSettings(accessToken: string, userId: UserId): Promise<UserSettings>;
  updateSettings(accessToken: string, userId: UserId, body: UpdateSettingsBody): Promise<UserSettings>;
}

const profileNotFound = (): ApiError => ApiError.notFound('Profile not found');

function trimmedOrNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined || value === null) return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function profileChanges(body: { full_name?: string; phone_number?: string | null; avatar_url?: string | null }): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (body.full_name !== undefined) row.full_name = body.full_name.trim();
  if (body.phone_number !== undefined) row.phone_number = trimmedOrNull(body.phone_number);
  if (body.avatar_url !== undefined) row.avatar_url = trimmedOrNull(body.avatar_url);
  return row;
}

/**
 * The caller's own profile, role profile and settings. Every query runs as the caller, filtered to
 * the caller's own rows (administrators can read every profile through RLS, so the filter matters).
 */
export function createMeService(deps: MeServiceDeps): MeService {
  async function loadProfile(client: SupabaseClient, userId: UserId): Promise<Profile | null> {
    const { data, error, status } = await client
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle<Profile>()
      .retry(false);
    if (error !== null) throw toApiError(error, status, 'load', 'profile');
    return data;
  }

  async function loadRoleProfile(client: SupabaseClient, role: UserRole, userId: UserId): Promise<RoleProfile | null> {
    const { data, error, status } = await client
      .from(ROLE_PROFILE_TABLES[role])
      .select(ROLE_PROFILE_COLUMNS[role])
      .eq('user_id', userId)
      .maybeSingle<RoleProfile>()
      .retry(false);
    if (error !== null) throw toApiError(error, status, 'load', 'profile');
    return data;
  }

  async function loadMe(client: SupabaseClient, userId: UserId): Promise<Me> {
    const profile = await loadProfile(client, userId);
    if (profile === null) throw profileNotFound();
    // The role comes from the stored profile (never the request).
    const roleProfile = await loadRoleProfile(client, profile.role, userId);
    return { profile, role_profile: roleProfile };
  }

  async function ensureSettingsRow(client: SupabaseClient, userId: UserId): Promise<void> {
    // INSERT ... ON CONFLICT (user_id) DO NOTHING ("Users create own settings"). Normally the row
    // already exists (created by the profiles trigger or the backfill).
    const { error, status } = await client
      .from('user_settings')
      .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })
      .retry(false);
    if (error !== null) throw toApiError(error, status, 'create', 'settings');
  }

  async function loadSettings(client: SupabaseClient, userId: UserId): Promise<UserSettings | null> {
    const { data, error, status } = await client
      .from('user_settings')
      .select(SETTINGS_COLUMNS)
      .eq('user_id', userId)
      .maybeSingle<UserSettings>()
      .retry(false);
    if (error !== null) throw toApiError(error, status, 'load', 'settings');
    return data;
  }

  return {
    async get(accessToken, user) {
      return loadMe(deps.createUserClient(accessToken), user.id);
    },

    async update(accessToken, user, body) {
      const profileRow = profileChanges(body);
      const roleRow: Record<string, unknown> = {};
      const roleFields = body.role_profile ?? {};
      if (Object.keys(roleFields).length > 0) {
        const allowed = user.role === null ? [] : ROLE_PROFILE_WRITABLE_FIELDS[user.role];
        for (const [field, value] of Object.entries(roleFields)) {
          if (!allowed.includes(field)) {
            throw validationError(`role_profile.${field} cannot be changed for your role`);
          }
          roleRow[field] = field === 'organisation_name' ? (value ?? '').trim() : trimmedOrNull(value);
        }
        if (roleRow.organisation_name === '') throw validationError('role_profile.organisation_name must not be blank');
      }
      if (Object.keys(profileRow).length === 0 && Object.keys(roleRow).length === 0) {
        throw validationError('At least one updatable field is required');
      }

      const client = deps.createUserClient(accessToken);
      if (Object.keys(roleRow).length > 0 && user.role !== null) {
        // "Users manage own <role> profile": only the caller's own row (user_id = auth.uid()).
        const { data, error, status } = await client
          .from(ROLE_PROFILE_TABLES[user.role])
          .update(roleRow)
          .eq('user_id', user.id)
          .select('id')
          .overrideTypes<Array<{ id: string }>, { merge: false }>()
          .retry(false);
        if (error !== null) throw toApiError(error, status, 'update', 'profile');
        if (data.length === 0) throw ApiError.notFound('Role profile not found; complete your profile first');
      }
      if (Object.keys(profileRow).length > 0) {
        // "Users can update their own profile". role and account_status are never sent; the
        // protect_profile_privileged_fields trigger would reject them anyway.
        const { data, error, status } = await client
          .from('profiles')
          .update(profileRow)
          .eq('id', user.id)
          .select('id')
          .overrideTypes<Array<{ id: string }>, { merge: false }>()
          .retry(false);
        if (error !== null) throw toApiError(error, status, 'update', 'profile');
        if (data.length === 0) throw profileNotFound();
      }
      return loadMe(client, user.id);
    },

    async completeProfile(accessToken, user, body) {
      const client = deps.createUserClient(accessToken);
      const profile = await loadProfile(client, user.id);
      if (profile === null) {
        // public.profiles has no INSERT policy for signed-in users; profiles are created by the
        // on_auth_user_created trigger at sign-up. Creating one here needs a database change.
        throw ApiError.notImplemented('Creating a profile is not supported yet; profiles are created at sign-up');
      }
      if (profile.role !== body.role) {
        // protect_profile_privileged_fields: users cannot change their own role.
        throw conflictError('Your role is already set and cannot be changed');
      }
      const existing = await loadRoleProfile(client, profile.role, user.id);
      if (existing !== null) throw conflictError('Your profile is already complete');

      const changes = profileChanges(body);
      if (Object.keys(changes).length > 0) {
        const { error, status } = await client.from('profiles').update(changes).eq('id', user.id).retry(false);
        if (error !== null) throw toApiError(error, status, 'update', 'profile');
      }

      // Same defaults as handle_new_user(): member_since for donors and volunteers, organisation_name
      // (NOT NULL) for sponsors falls back to the full name.
      const roleRow: Record<string, unknown> = { user_id: user.id };
      if (body.role === 'donor' || body.role === 'volunteer') roleRow.member_since = todayInJohannesburg();
      if (body.role === 'sponsor') {
        roleRow.organisation_name = body.organisation_name?.trim() || (changes.full_name as string | undefined) || profile.full_name;
      }
      const { error, status } = await client.from(ROLE_PROFILE_TABLES[body.role]).insert(roleRow).retry(false);
      if (error !== null) {
        if (error.code === '23505') throw conflictError('Your profile is already complete');
        throw toApiError(error, status, 'create', 'profile');
      }
      return loadMe(client, user.id);
    },

    async getSettings(accessToken, userId) {
      const client = deps.createUserClient(accessToken);
      const settings = await loadSettings(client, userId);
      if (settings !== null) return settings;
      await ensureSettingsRow(client, userId);
      const created = await loadSettings(client, userId);
      if (created === null) throw ApiError.forbidden();
      return created;
    },

    async updateSettings(accessToken, userId, body) {
      const row: Record<string, unknown> = {};
      for (const field of SETTINGS_WRITABLE_FIELDS) {
        if (body[field] !== undefined) row[field] = body[field];
      }
      if (Object.keys(row).length === 0) throw validationError('At least one setting is required');

      const client = deps.createUserClient(accessToken);
      await ensureSettingsRow(client, userId);
      const { data, error, status } = await client
        .from('user_settings')
        .update(row)
        .eq('user_id', userId)
        .select(SETTINGS_COLUMNS)
        .overrideTypes<UserSettings[], { merge: false }>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'update', 'settings');
      const updated = data[0];
      if (updated === undefined) throw ApiError.forbidden();
      return updated;
    },
  };
}
