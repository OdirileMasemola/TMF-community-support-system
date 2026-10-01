import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiError } from '../shared/errors/ApiError.js';
import type { UserRole } from '../shared/types/auth.types.js';

/**
 * Returns a preHandler that only lets users with one of the given roles through.
 * Must run after `authenticate`:
 *
 *   { preHandler: [authenticate, requireRole('administrator')] }
 *
 * - No authenticated user -> 401.
 * - Missing or different role -> 403 (the required roles are not revealed).
 *
 * The role comes only from `request.user`, which authenticate fills from `public.profiles`.
 * Admin is the `administrator` role.
 */
export function requireRole(...allowedRoles: [UserRole, ...UserRole[]]) {
  return async function requireRoleHandler(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const user = request.user;
    if (user === null) {
      throw ApiError.unauthorized();
    }
    if (user.role === null || !allowedRoles.includes(user.role)) {
      throw ApiError.forbidden();
    }
  };
}
