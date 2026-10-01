import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { PERMITTED_ACCOUNT_STATUSES, USER_ROLES } from '../../shared/types/auth.types.js';
import { ERROR_RESPONSE_SCHEMA_REF } from '../../shared/utils/response.js';
import { getMe } from './auth.controller.js';

const meResponseSchema = {
  type: 'object',
  required: ['data'],
  properties: {
    data: {
      type: 'object',
      required: ['id', 'email', 'role', 'accountStatus'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        email: { type: ['string', 'null'] },
        role: { type: ['string', 'null'], enum: [...USER_ROLES, null] },
        accountStatus: { type: ['string', 'null'], enum: [...PERMITTED_ACCOUNT_STATUSES, null] },
      },
    },
  },
} as const;

/** Auth routes, registered under /api/v1/auth. */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/me',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Current user',
        description:
          "Returns the authenticated user's id, email, role and account status (from public.profiles). " +
          'Suspended accounts receive 403 ACCOUNT_DISABLED.',
        security: [{ bearerAuth: [] }],
        response: {
          200: meResponseSchema,
          401: ERROR_RESPONSE_SCHEMA_REF,
          403: ERROR_RESPONSE_SCHEMA_REF,
          503: ERROR_RESPONSE_SCHEMA_REF,
        },
      },
    },
    getMe,
  );
}
