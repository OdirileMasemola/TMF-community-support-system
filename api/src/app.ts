import type { SupabaseClient } from '@supabase/supabase-js';
import Fastify, { type FastifyInstance } from 'fastify';
import type { AppConfig } from './config/env.js';
import { registerErrorHandlers } from './middleware/errorHandler.js';
import { registerCors } from './plugins/cors.js';
import { registerRateLimit } from './plugins/rateLimit.js';
import { registerSupabase } from './plugins/supabase.js';
import { registerSwagger } from './plugins/swagger.js';
import { createSupabaseAuthProvider } from './modules/auth/auth.service.js';
import { registerRoutes } from './routes/index.js';
import { buildLoggerOptions } from './shared/logger/logger.js';
import type { AuthProvider } from './shared/types/auth.types.js';
import { errorResponseSchema } from './shared/utils/response.js';

export interface BuildAppOptions {
  /**
   * Overrides how access tokens are verified and roles resolved (tests only).
   * Defaults to the Supabase-backed provider.
   */
  authProvider?: AuthProvider;
  /**
   * Overrides how user-scoped Supabase clients are created (tests only, e.g. a client with a fake
   * fetch). Defaults to a publishable-key client that sends the caller's access token.
   */
  createUserClient?: (accessToken: string) => SupabaseClient;
}

/**
 * Builds a fully configured Fastify instance without starting the HTTP server.
 * Used by server.ts and by tests (via `app.inject`).
 */
export async function buildApp(config: AppConfig, options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: buildLoggerOptions(config),
  });

  registerErrorHandlers(app);

  await registerCors(app, config);
  await registerRateLimit(app, config);
  await registerSwagger(app, config);
  registerSupabase(app, config, options.createUserClient);

  app.decorate('authProvider', options.authProvider ?? createSupabaseAuthProvider(app));
  app.decorateRequest('user', null);

  app.addSchema(errorResponseSchema);
  await registerRoutes(app);

  return app;
}
