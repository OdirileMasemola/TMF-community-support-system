import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './pagination.js';
import { ERROR_RESPONSE_SCHEMA_REF } from './response.js';

/*
 * JSON Schema building blocks shared by the v1 modules (same shapes as the campaigns module).
 */

/** At least one non-whitespace character. */
export const NOT_BLANK = '\\S';

export const paginationQueryProperties = {
  page: { type: 'integer', minimum: 1, default: DEFAULT_PAGE },
  pageSize: { type: 'integer', minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE },
} as const;

export const paginationQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: paginationQueryProperties,
} as const;

export const paginationMetaProperties = {
  page: { type: 'integer' },
  pageSize: { type: 'integer' },
  total: { type: 'integer' },
  totalPages: { type: 'integer' },
} as const;

export const paginationMetaSchema = {
  type: 'object',
  required: ['page', 'pageSize', 'total', 'totalPages'],
  properties: paginationMetaProperties,
} as const;

export function idParamsSchema(description: string) {
  return {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string', format: 'uuid', description } },
  } as const;
}

export function dataResponse<TSchema extends object>(schema: TSchema) {
  return { type: 'object', required: ['data'], properties: { data: schema } } as const;
}

export function listResponse<TSchema extends object>(items: TSchema) {
  return {
    type: 'object',
    required: ['data', 'meta'],
    properties: { data: { type: 'array', items }, meta: paginationMetaSchema },
  } as const;
}

/** Error responses: 400, 401, 403 (incl. ACCOUNT_DISABLED), 500 and 503 plus the given extra codes. */
export function errorResponses(...extra: Array<404 | 409 | 501>) {
  const responses: Record<number, typeof ERROR_RESPONSE_SCHEMA_REF> = {
    400: ERROR_RESPONSE_SCHEMA_REF,
    401: ERROR_RESPONSE_SCHEMA_REF,
    403: ERROR_RESPONSE_SCHEMA_REF,
    500: ERROR_RESPONSE_SCHEMA_REF,
    503: ERROR_RESPONSE_SCHEMA_REF,
  };
  for (const code of extra) responses[code] = ERROR_RESPONSE_SCHEMA_REF;
  return responses;
}

export const bearerSecurity = [{ bearerAuth: [] }];
