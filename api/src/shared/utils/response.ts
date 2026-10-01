import type { ErrorCode } from '../errors/errorCodes.js';
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
