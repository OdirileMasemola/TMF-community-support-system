import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiError } from '../shared/errors/ApiError.js';
import { ErrorCodes } from '../shared/errors/errorCodes.js';
import { isPermittedAccountStatus, type PermittedAccountStatus } from '../shared/types/auth.types.js';

/**
 * Extracts the token from an `Authorization: Bearer <token>` header.
 * Parsing only: this does NOT verify the token.
 */
export function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (authorizationHeader === undefined) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(authorizationHeader.trim());
  return match?.[1] ?? null;
}

/**
 * preHandler that requires a valid Supabase access token.
 *
 * 1. Requires `Authorization: Bearer <token>` (missing or malformed -> 401).
 * 2. Verifies the token with the Supabase Auth server (invalid/expired -> 401,
 *    Auth unreachable -> 503).
 * 3. Loads role and account_status from `public.profiles` as that user (RLS applies).
 * 4. Rejects accounts whose status is not permitted (e.g. 'suspended') with 403
 *    ACCOUNT_DISABLED. 'active' and 'pending' are allowed (see PERMITTED_ACCOUNT_STATUSES).
 *    A user without a profile row is let through with role and accountStatus null, so
 *    requireRole() still rejects them.
 * 5. Sets `request.user = { id, email, role, accountStatus }`.
 *
 * The token is never logged or returned (the logger also redacts the Authorization header).
 * User id, role and account status are never taken from the request body, query string
 * or other headers.
 */
export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (header === undefined || header.trim() === '') {
    throw ApiError.unauthorized('Missing access token');
  }

  const accessToken = extractBearerToken(header);
  if (accessToken === null) {
    throw ApiError.unauthorized('Authorization header must be in the format: Bearer <token>');
  }

  const { authProvider } = request.server;
  const verifiedUser = await authProvider.getUser(accessToken);
  if (verifiedUser === null) {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  const profile = await authProvider.getProfile(verifiedUser.id, accessToken);

  let accountStatus: PermittedAccountStatus | null = null;
  if (profile !== null) {
    if (!isPermittedAccountStatus(profile.accountStatus)) {
      // Generic message: the reason (status) is not echoed back.
      throw new ApiError(403, ErrorCodes.ACCOUNT_DISABLED, 'Account is not permitted to access this resource');
    }
    accountStatus = profile.accountStatus;
  }

  request.user = {
    id: verifiedUser.id,
    email: verifiedUser.email ?? null,
    role: profile?.role ?? null,
    accountStatus,
  };
}
