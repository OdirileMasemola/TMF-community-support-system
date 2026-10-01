import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiError } from '../shared/errors/ApiError.js';
import type { UserRole } from '../shared/types/auth.types.js';

/**
 * FOUNDATION ONLY - role-based authorization preHandler factory, not used on any route yet.
 * Must run after `authenticate`. It relies solely on `request.auth`, which only the
 * authenticate middleware may set (from a verified token + server-side role lookup).
 * Because authentication is not implemented, `request.auth` is never set and this always
 * responds 401.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return async function authorizeHandler(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    const auth = request.auth;
    if (auth === undefined) {
      throw ApiError.unauthorized();
    }
    if (allowedRoles.length > 0 && (auth.user.role === null || !allowedRoles.includes(auth.user.role))) {
      throw ApiError.forbidden();
    }
  };
}
