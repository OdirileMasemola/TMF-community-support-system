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

/** Supabase auth user id (UUID). */
export type UserId = User['id'];

/** The subset of the Supabase `User` the API relies on after the token is verified. */
export type VerifiedSupabaseUser = Pick<User, 'id' | 'email'>;

/** Authenticated caller, attached to `request.user` by the authenticate middleware. */
export interface AuthUser {
  id: UserId;
  email: string | null;
  /** From `public.profiles.role`; null when the user has no profile row (yet). */
  role: UserRole | null;
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
   * Reads the user's role from `public.profiles` as that user (RLS applies).
   * Resolves to null when there is no profile row or the value is not a known role.
   */
  getRole(userId: UserId, accessToken: string): Promise<UserRole | null>;
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
