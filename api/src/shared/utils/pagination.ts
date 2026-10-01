import type { PaginationMeta } from '../types/api.types.js';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationQuery {
  page?: number | string;
  pageSize?: number | string;
}

function toPositiveInt(value: number | string | undefined, fallback: number): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return parsed !== undefined && Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Normalises page/pageSize query values with defaults and an upper bound on page size. */
export function parsePagination(query: PaginationQuery = {}): PaginationParams {
  return {
    page: toPositiveInt(query.page, DEFAULT_PAGE),
    pageSize: Math.min(toPositiveInt(query.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE),
  };
}

/** Zero-based inclusive row range, matching Supabase's `.range(from, to)`. */
export function toRange({ page, pageSize }: PaginationParams): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function buildPaginationMeta(total: number, { page, pageSize }: PaginationParams): PaginationMeta {
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
