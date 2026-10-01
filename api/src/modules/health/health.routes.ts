import type { FastifyInstance } from 'fastify';
import { getHealth } from './health.controller.js';

const healthResponseSchema = {
  type: 'object',
  required: ['status', 'service', 'timestamp'],
  properties: {
    status: { type: 'string', enum: ['ok'] },
    service: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
  },
} as const;

/** Health routes, registered under the /api prefix -> GET /api/health. */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/health',
    {
      schema: {
        tags: ['health'],
        summary: 'Service health check',
        description: 'Returns 200 when the API process is up. Does not check the database.',
        response: { 200: healthResponseSchema },
      },
    },
    getHealth,
  );
}
