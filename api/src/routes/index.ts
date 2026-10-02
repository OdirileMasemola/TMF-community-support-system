import type { FastifyInstance } from 'fastify';
import { API_PREFIX, API_V1_PREFIX } from '../config/constants.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { campaignRoutes } from '../modules/campaigns/campaign.routes.js';
import { healthRoutes } from '../modules/health/health.routes.js';

/**
 * Versioned v1 routes (/api/v1/...). Add modules here, e.g.
 * `await app.register(someModuleRoutes, { prefix: '/some-module' });`
 */
async function v1Routes(app: FastifyInstance): Promise<void> {
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(campaignRoutes, { prefix: '/campaigns' });
}

/** Registers all route modules. */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Unversioned operational routes.
  await app.register(healthRoutes, { prefix: API_PREFIX });

  // Versioned business routes.
  await app.register(v1Routes, { prefix: API_V1_PREFIX });
}
