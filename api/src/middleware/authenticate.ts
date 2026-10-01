import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiError } from '../shared/errors/ApiError.js';

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
 * 3. Loads the role from `public.profiles` as that user (RLS applies).
 * 4. Sets `request.user = { id, email, role }`.
 *
 * The token is never logged or returned (the logger also redacts the Authorization header).
 * User id and role are never taken from the request body, query string or other headers.
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

  const role = await authProvider.getRole(verifiedUser.id, accessToken);

  request.user = {
    id: verifiedUser.id,
    email: verifiedUser.email ?? null,
    role,
  };
}
