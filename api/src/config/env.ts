import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEFAULT_API_VERSION,
  DEFAULT_HOST,
  DEFAULT_LOG_LEVEL,
  DEFAULT_PORT,
  DEFAULT_RATE_LIMIT_MAX,
} from './constants.js';

export const NODE_ENVS = ['development', 'test', 'production'] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];

export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

export interface AppConfig {
  nodeEnv: NodeEnv;
  isProduction: boolean;
  host: string;
  port: number;
  logLevel: LogLevel;
  supabaseUrl: string;
  /** Supabase publishable (anon) key. Never the service-role key. */
  supabasePublishableKey: string;
  /** Allowed CORS origins. Empty means: permissive in development/test, no cross-origin access in production. */
  corsOrigins: string[];
  rateLimitMax: number;
  apiVersion: string;
}

/** Thrown when configuration is missing or invalid. Messages never contain secret values. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

type Env = Record<string, string | undefined>;

function read(env: Env, name: string): string | undefined {
  const value = env[name]?.trim();
  return value === undefined || value === '' ? undefined : value;
}

function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((allowed) => allowed === value);
}

function parsePositiveInt(value: string | undefined, fallback: number): number | undefined {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Reads and validates configuration from environment variables.
 * Throws a ConfigError listing every problem (variable names only, never values).
 */
export function loadConfig(env: Env = process.env): AppConfig {
  const errors: string[] = [];

  const nodeEnvRaw = read(env, 'NODE_ENV') ?? 'development';
  let nodeEnv: NodeEnv = 'development';
  if (isOneOf(NODE_ENVS, nodeEnvRaw)) {
    nodeEnv = nodeEnvRaw;
  } else {
    errors.push(`NODE_ENV must be one of: ${NODE_ENVS.join(', ')}`);
  }
  const isProduction = nodeEnv === 'production';

  const port = parsePositiveInt(read(env, 'PORT'), DEFAULT_PORT);
  if (port === undefined || port > 65535) {
    errors.push('PORT must be an integer between 1 and 65535');
  }

  const logLevelRaw = read(env, 'LOG_LEVEL') ?? DEFAULT_LOG_LEVEL;
  let logLevel: LogLevel = DEFAULT_LOG_LEVEL;
  if (isOneOf(LOG_LEVELS, logLevelRaw)) {
    logLevel = logLevelRaw;
  } else {
    errors.push(`LOG_LEVEL must be one of: ${LOG_LEVELS.join(', ')}`);
  }

  const supabaseUrl = read(env, 'SUPABASE_URL');
  if (supabaseUrl === undefined) {
    errors.push('SUPABASE_URL is required');
  } else if (!isHttpUrl(supabaseUrl)) {
    errors.push('SUPABASE_URL must be a valid http(s) URL');
  }

  const supabasePublishableKey = read(env, 'SUPABASE_PUBLISHABLE_KEY');
  if (supabasePublishableKey === undefined) {
    errors.push('SUPABASE_PUBLISHABLE_KEY is required');
  }

  const corsOrigins = (read(env, 'CORS_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin !== '');
  if (isProduction && corsOrigins.includes('*')) {
    errors.push('CORS_ORIGINS must list explicit origins in production ("*" is not allowed)');
  }

  const rateLimitMax = parsePositiveInt(read(env, 'RATE_LIMIT_MAX'), DEFAULT_RATE_LIMIT_MAX);
  if (rateLimitMax === undefined) {
    errors.push('RATE_LIMIT_MAX must be a positive integer');
  }

  if (
    errors.length > 0 ||
    port === undefined ||
    rateLimitMax === undefined ||
    supabaseUrl === undefined ||
    supabasePublishableKey === undefined
  ) {
    throw new ConfigError(`Invalid environment configuration:\n  - ${errors.join('\n  - ')}`);
  }

  return {
    nodeEnv,
    isProduction,
    host: DEFAULT_HOST,
    port,
    logLevel,
    supabaseUrl,
    supabasePublishableKey,
    corsOrigins,
    rateLimitMax,
    apiVersion: read(env, 'API_VERSION') ?? DEFAULT_API_VERSION,
  };
}

/**
 * Local development convenience: loads api/.env into process.env if the file exists
 * (Node's built-in loader, no extra dependency). In Azure, configure App Settings instead.
 */
export function loadDotEnvIfPresent(path: string = resolve(process.cwd(), '.env')): void {
  if (existsSync(path)) {
    process.loadEnvFile(path);
  }
}
