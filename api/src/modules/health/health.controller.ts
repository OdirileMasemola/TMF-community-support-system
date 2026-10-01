import type { FastifyReply, FastifyRequest } from 'fastify';
import { APP_NAME } from '../../config/constants.js';

export interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}

/** Liveness check. Intentionally does not query the database. */
export async function getHealth(_request: FastifyRequest, _reply: FastifyReply): Promise<HealthResponse> {
  return {
    status: 'ok',
    service: APP_NAME,
    timestamp: new Date().toISOString(),
  };
}
