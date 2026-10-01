import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config/env.js';

/**
 * Origin policy:
 * - CORS_ORIGINS set: only those origins are allowed (any environment).
 * - CORS_ORIGINS empty in development/test: any origin is reflected (permissive for local dev).
 * - CORS_ORIGINS empty in production: no cross-origin access. "*" is rejected in production by env.ts.
 */
export function resolveCorsOrigin(config: Pick<AppConfig, 'corsOrigins' | 'isProduction'>): string[] | boolean {
  if (config.corsOrigins.length > 0) return config.corsOrigins;
  return !config.isProduction;
}

/** Registers @fastify/cors on the root instance so it applies to every route. */
export async function registerCors(app: FastifyInstance, config: AppConfig): Promise<void> {
  await app.register(cors, {
    origin: resolveCorsOrigin(config),
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Auth uses bearer tokens in the Authorization header, not cookies.
    credentials: false,
  });
}
