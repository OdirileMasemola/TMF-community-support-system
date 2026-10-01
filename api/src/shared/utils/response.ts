import { ErrorCodes, type ErrorCode } from '../errors/errorCodes.js';
import type { ApiErrorBody, ApiSuccessBody, PaginatedBody, PaginationMeta } from '../types/api.types.js';

/** Wraps data in the standard success envelope. */
export function successResponse<TData>(data: TData): ApiSuccessBody<TData> {
  return { data };
}

/** Wraps a page of items with pagination metadata. */
export function paginatedResponse<TItem>(items: TItem[], meta: PaginationMeta): PaginatedBody<TItem> {
  return { data: items, meta };
}

/** Builds the standard error body. */
export function errorResponse(code: ErrorCode, message: string): ApiErrorBody {
  return { error: { code, message } };
}

/**
 * Shared JSON schema for the standard error body. Registered once with `app.addSchema`
 * (see app.ts) and referenced from route `response` schemas via ERROR_RESPONSE_SCHEMA_REF.
 */
export const errorResponseSchema = {
  $id: 'ErrorResponse',
  type: 'object',
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: { type: 'string', enum: Object.values(ErrorCodes) },
        message: { type: 'string' },
      },
    },
  },
} as const;

export const ERROR_RESPONSE_SCHEMA_REF = { $ref: 'ErrorResponse#' } as const;
