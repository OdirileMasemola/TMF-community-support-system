import type { FastifyInstance } from 'fastify';
import { API_PREFIX, API_V1_PREFIX } from '../config/constants.js';
import { healthRoutes } from '../modules/health/health.routes.js';

/**
 * Versioned v1 routes (/api/v1/...). Intentionally empty: business modules are added in
 * later phases, e.g. `await app.register(someModuleRoutes, { prefix: '/some-module' });`
 */
async function v1Routes(_app: FastifyInstance): Promise<void> {
  // No v1 routes yet.
}

/** Registers all route modules. */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Unversioned operational routes.
  await app.register(healthRoutes, { prefix: API_PREFIX });

  // Versioned business routes.
  await app.register(v1Routes, { prefix: API_V1_PREFIX });
}
