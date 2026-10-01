/**
 * Auth context types. Supabase Auth is the only identity provider; this API never
 * issues its own tokens or stores credentials.
 */

/**
 * Application roles. Mirrors the `role` values already used by web/ (profiles.role in Supabase).
 * The role must always be resolved server-side (from the verified user / database),
 * never taken from a request body, query string or custom header.
 */
export type UserRole = 'administrator' | 'donor' | 'volunteer' | 'beneficiary' | 'sponsor';

/** Supabase auth user id (UUID). */
export type UserId = string;

export interface AuthUser {
  id: UserId;
  email: string | null;
  /** Resolved server-side; null until the user's profile/role is known. */
  role: UserRole | null;
}

/** Per-request authentication context, populated only by the authenticate middleware. */
export interface AuthContext {
  user: AuthUser;
  /** The caller's Supabase access token (JWT), used to create a user-scoped Supabase client. */
  accessToken: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    /** Set only after successful authentication (not implemented yet). */
    auth?: AuthContext;
  }
}
