import type { FastifyServerOptions } from 'fastify';
import type { AppConfig } from '../../config/env.js';

/** Header paths that must never appear in logs. */
const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  'headers.authorization',
  'headers.cookie',
];

/**
 * Pino logger options for Fastify's built-in logger.
 * Fastify's default request serializer does not log headers, but sensitive
 * headers are redacted defensively in case custom serializers or log calls include them.
 */
export function buildLoggerOptions(
  config: Pick<AppConfig, 'logLevel'>,
): NonNullable<FastifyServerOptions['logger']> {
  return {
    level: config.logLevel,
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
  };
}
