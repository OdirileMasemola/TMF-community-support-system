import type { FastifyRequest } from 'fastify';
import { extractBearerToken } from '../../middleware/authenticate.js';
import { ApiError } from '../errors/ApiError.js';
import type { AuthUser } from '../types/auth.types.js';

/**
 * The caller's verified user and access token (same as the campaigns controller's helper).
 * `authenticate` has already verified the token; it is re-read from the header only to build the
 * user-scoped Supabase client.
 */
export function caller(request: FastifyRequest): { user: AuthUser; accessToken: string } {
  const accessToken = extractBearerToken(request.headers.authorization);
  if (request.user === null || accessToken === null) {
    throw ApiError.unauthorized();
  }
  return { user: request.user, accessToken };
}
