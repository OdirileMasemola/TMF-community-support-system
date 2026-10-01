/**
 * Auth types. Supabase Auth is the only identity provider; this API never
 * issues its own tokens or stores credentials.
 */
import type { User } from '@supabase/supabase-js';

/**
 * Application roles: the values of the `public.user_role` enum used by `profiles.role`
 * (the same values web/ uses). "Admin" is `administrator`; there is no separate `admin` role.
 * The role is always read server-side from `public.profiles`, never from the token's
 * user_metadata (client-controlled at sign-up), the request body, query string or headers.
 */
export const USER_ROLES = ['administrator', 'donor', 'volunteer', 'beneficiary', 'sponsor'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.some((role) => role === value);
}

/**
 * Values allowed by the `profiles_account_status_check` constraint on `profiles.account_status`.
 */
export const ACCOUNT_STATUSES = ['pending', 'active', 'suspended'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

/**
 * Account statuses allowed to use the API. Matches the web and mobile apps, which let
 * 'pending' (not yet approved) users sign in and use their dashboards. 'suspended' is rejected.
 * Modules that must be limited to approved accounts can check `request.user.accountStatus`.
 */
export const PERMITTED_ACCOUNT_STATUSES = ['active', 'pending'] as const;
export type PermittedAccountStatus = (typeof PERMITTED_ACCOUNT_STATUSES)[number];

export function isAccountStatus(value: unknown): value is AccountStatus {
  return ACCOUNT_STATUSES.some((status) => status === value);
}

export function isPermittedAccountStatus(value: unknown): value is PermittedAccountStatus {
  return PERMITTED_ACCOUNT_STATUSES.some((status) => status === value);
}

/** Supabase auth user id (UUID). */
export type UserId = User['id'];

/** The subset of the Supabase `User` the API relies on after the token is verified. */
export type VerifiedSupabaseUser = Pick<User, 'id' | 'email'>;

/** The authorization-relevant fields of the caller's `public.profiles` row. */
export interface AuthProfile {
  /** null if the stored value is not a known role. */
  role: UserRole | null;
  /** null if the stored value is not a known status (treated as not permitted). */
  accountStatus: AccountStatus | null;
}

/** Authenticated caller, attached to `request.user` by the authenticate middleware. */
export interface AuthUser {
  id: UserId;
  email: string | null;
  /** From `public.profiles.role`; null when the user has no profile row (yet). */
  role: UserRole | null;
  /** From `public.profiles.account_status`; null when the user has no profile row (yet). */
  accountStatus: PermittedAccountStatus | null;
}

/**
 * Verifies access tokens and resolves roles. The production implementation is backed by
 * Supabase (see modules/auth/auth.service.ts); tests can inject their own.
 */
export interface AuthProvider {
  /**
   * Verifies the access token with the Supabase Auth server.
   * Resolves to null when the token is invalid or expired.
   * Throws an ApiError (503) when the Auth server cannot be reached.
   */
  getUser(accessToken: string): Promise<VerifiedSupabaseUser | null>;

  /**
   * Reads the user's role and account status from `public.profiles` in one query,
   * as that user (RLS applies). Resolves to null when there is no profile row.
   */
  getProfile(userId: UserId, accessToken: string): Promise<AuthProfile | null>;
}

declare module 'fastify' {
  interface FastifyInstance {
    authProvider: AuthProvider;
  }

  interface FastifyRequest {
    /** Set by the authenticate middleware; null on routes that do not authenticate. */
    user: AuthUser | null;
  }
}
