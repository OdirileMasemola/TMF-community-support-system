import Fastify, { type FastifyInstance } from 'fastify';
import type { AppConfig } from './config/env.js';
import { registerErrorHandlers } from './middleware/errorHandler.js';
import { registerCors } from './plugins/cors.js';
import { registerRateLimit } from './plugins/rateLimit.js';
import { registerSupabase } from './plugins/supabase.js';
import { registerSwagger } from './plugins/swagger.js';
import { registerRoutes } from './routes/index.js';
import { buildLoggerOptions } from './shared/logger/logger.js';

/**
 * Builds a fully configured Fastify instance without starting the HTTP server.
 * Used by server.ts and by tests (via `app.inject`).
 */
export async function buildApp(config: AppConfig): Promise<FastifyInstance> {
  const app = Fastify({
    logger: buildLoggerOptions(config),
  });

  registerErrorHandlers(app);

  await registerCors(app, config);
  await registerRateLimit(app, config);
  await registerSwagger(app, config);
  registerSupabase(app, config);

  await registerRoutes(app);

  return app;
}
