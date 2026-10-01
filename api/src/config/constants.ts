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
