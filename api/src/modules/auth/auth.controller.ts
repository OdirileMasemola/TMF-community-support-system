import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiError } from '../../shared/errors/ApiError.js';
import type { AuthUser } from '../../shared/types/auth.types.js';
import type { ApiSuccessBody } from '../../shared/types/api.types.js';
import { successResponse } from '../../shared/utils/response.js';

/** Returns the authenticated caller's safe profile info (never tokens or secrets). */
export async function getMe(request: FastifyRequest, _reply: FastifyReply): Promise<ApiSuccessBody<AuthUser>> {
  const user = request.user;
  if (user === null) {
    throw ApiError.unauthorized();
  }
  return successResponse({ id: user.id, email: user.email, role: user.role, accountStatus: user.accountStatus });
}
