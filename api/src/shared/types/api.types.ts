import type { ErrorCode } from '../errors/errorCodes.js';

/** Standard error body returned by every failing request. */
export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
  };
}

/** Standard success envelope for future resource endpoints. */
export interface ApiSuccessBody<TData, TMeta = undefined> {
  data: TData;
  meta?: TMeta;
}

/** Pagination metadata returned alongside list results. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Envelope for paginated list endpoints. */
export type PaginatedBody<TItem> = ApiSuccessBody<TItem[], PaginationMeta>;
