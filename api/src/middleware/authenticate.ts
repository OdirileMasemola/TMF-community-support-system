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
 * EXTENSION POINT - authentication is NOT implemented yet and this hook is not
 * registered on any route.
 *
 * Next phase: verify the Supabase access token server-side (e.g. Supabase JWKS /
 * `supabase.auth.getClaims()` or `supabase.auth.getUser(token)`), resolve the user's
 * role from the database, then set `request.auth`. User id and role must never be
 * taken from the request body, query string or custom headers.
 *
 * Until then it always fails closed with 501 NOT_IMPLEMENTED.
 */
export async function authenticate(_request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  throw ApiError.notImplemented('Authentication is not implemented yet');
}
