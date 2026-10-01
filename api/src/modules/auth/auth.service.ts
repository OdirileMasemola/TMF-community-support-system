import { isAuthApiError, isAuthSessionMissingError, type SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { ErrorCodes } from '../../shared/errors/errorCodes.js';
import {
  isUserRole,
  type AuthProvider,
  type UserId,
  type UserRole,
  type VerifiedSupabaseUser,
} from '../../shared/types/auth.types.js';

export interface SupabaseAuthDeps {
  /** Publishable-key client, used to verify tokens with Supabase Auth. */
  supabase: SupabaseClient;
  /** Creates a client that acts as the user (their token is sent, so RLS applies). */
  createUserClient: (accessToken: string) => SupabaseClient;
}

function authServiceUnavailable(cause: unknown): ApiError {
  return new ApiError(503, ErrorCodes.SERVICE_UNAVAILABLE, 'Authentication service is unavailable', { cause });
}

/**
 * Supabase-backed AuthProvider (the production implementation).
 * Raw Supabase errors are never returned to clients; they are only attached as `cause`.
 */
export function createSupabaseAuthProvider(deps: SupabaseAuthDeps): AuthProvider {
  return {
    async getUser(accessToken: string): Promise<VerifiedSupabaseUser | null> {
      let result: Awaited<ReturnType<SupabaseClient['auth']['getUser']>>;
      try {
        // Calls GET /auth/v1/user on the Supabase Auth server, which validates the JWT
        // (signature, expiry, revoked session). Nothing is decoded and trusted locally.
        result = await deps.supabase.auth.getUser(accessToken);
      } catch (error) {
        throw authServiceUnavailable(error);
      }

      const { data, error } = result;
      if (error !== null) {
        // 4xx from Auth (bad/expired JWT, deleted user) or a signed-out session: invalid token.
        if ((isAuthApiError(error) && error.status >= 400 && error.status < 500) || isAuthSessionMissingError(error)) {
          return null;
        }
        // Network failures, 5xx and unparseable responses: we could not verify the token.
        throw authServiceUnavailable(error);
      }

      return { id: data.user.id, email: data.user.email };
    },

    async getRole(userId: UserId, accessToken: string): Promise<UserRole | null> {
      const client = deps.createUserClient(accessToken);
      // RLS ("Users can read their own profile": id = auth.uid()) limits this to the caller's row.
      // Retries are disabled: this runs on every authenticated request, so fail fast (503)
      // instead of waiting through supabase-js's exponential backoff (up to ~7s).
      const { data, error, status } = await client
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
        .retry(false);

      if (error !== null) {
        if (status === 401) {
          throw ApiError.unauthorized('Invalid or expired access token');
        }
        if (status === 0 || status >= 500) {
          throw new ApiError(503, ErrorCodes.SERVICE_UNAVAILABLE, 'Unable to load user profile', { cause: error });
        }
        throw new ApiError(500, ErrorCodes.INTERNAL_ERROR, 'Unable to load user profile', { cause: error });
      }

      const row: unknown = data;
      if (typeof row !== 'object' || row === null || !('role' in row)) {
        return null; // No profile row visible to this user.
      }
      return isUserRole(row.role) ? row.role : null;
    },
  };
}
