/**
 * Application-wide technical constants.
 * Business constants (campaign types, statuses, etc.) do not belong here.
 */

export const APP_NAME = 'TMF Community Support API';

/** Default API version label (shown in the OpenAPI docs). Override with API_VERSION. */
export const DEFAULT_API_VERSION = '0.1.0';

/** Base prefix for all API routes. */
export const API_PREFIX = '/api';

/** Prefix for versioned v1 business routes (added in later phases). */
export const API_V1_PREFIX = `${API_PREFIX}/v1`;

/** Path where the OpenAPI / Swagger UI documentation is served. */
export const DOCS_PREFIX = '/docs';

export const DEFAULT_HOST = '0.0.0.0';
export const DEFAULT_PORT = 3000;

export const DEFAULT_LOG_LEVEL = 'info';

/** Default maximum number of requests per client per rate-limit window. */
export const DEFAULT_RATE_LIMIT_MAX = 100;
export const RATE_LIMIT_TIME_WINDOW = '1 minute';

/** Registration email check (POST /api/v1/auth/registration/email-check). */
export const DEFAULT_EMAIL_CHECK_RATE_LIMIT_MAX = 10;
export const DEFAULT_EMAIL_DNS_TIMEOUT_MS = 3000;
export const MAX_EMAIL_DNS_TIMEOUT_MS = 10000;
export const DEFAULT_EMAIL_DNS_CACHE_TTL_SECONDS = 3600;
/** Shortest accepted EMAIL_SIGNUP_ATTESTATION_SECRET. */
export const MIN_ATTESTATION_SECRET_LENGTH = 32;
