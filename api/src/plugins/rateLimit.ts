import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config/env.js';
import { RATE_LIMIT_TIME_WINDOW } from '../config/constants.js';

/** Global per-client rate limit (in-memory store). Max requests per window comes from RATE_LIMIT_MAX. */
export async function registerRateLimit(app: FastifyInstance, config: AppConfig): Promise<void> {
  await app.register(rateLimit, {
    global: true,
    max: config.rateLimitMax,
    timeWindow: RATE_LIMIT_TIME_WINDOW,
  });
}
