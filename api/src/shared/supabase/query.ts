import type { PostgrestError } from '@supabase/supabase-js';
import type { ApiError } from '../errors/ApiError.js';

/** The fields of a PostgREST list response that the helpers below use. */
export interface ListResult<TRow> {
  data: TRow[] | null;
  error: PostgrestError | null;
  status: number;
  count: number | null;
}

/** The fields of a PostgREST `head: true` count response. */
export interface CountResult {
  error: PostgrestError | null;
  status: number;
  count: number | null;
}

export interface Page<TItem> {
  items: TItem[];
  total: number;
}

/**
 * Runs a paginated list query (`select(..., { count: 'exact' })` + `.range()`), as the campaigns
 * module does: when the page starts after the last row PostgREST answers PGRST103, so the real total
 * is read with a `head: true` count query and an empty page is returned.
 */
export async function runPagedQuery<TRow>(
  page: PromiseLike<ListResult<TRow>>,
  countOnly: () => PromiseLike<CountResult>,
  toError: (error: PostgrestError, status: number) => ApiError,
): Promise<Page<TRow>> {
  const { data, error, status, count } = await page;
  if (error !== null) {
    if (error.code === 'PGRST103') {
      const head = await countOnly();
      if (head.error !== null) throw toError(head.error, head.status);
      return { items: [], total: head.count ?? 0 };
    }
    throw toError(error, status);
  }
  return { items: data ?? [], total: count ?? 0 };
}

/** Awaits a `head: true` count query and returns the count (0 when PostgREST sends none). */
export async function runCountQuery(
  query: PromiseLike<CountResult>,
  toError: (error: PostgrestError, status: number) => ApiError,
): Promise<number> {
  const { error, status, count } = await query;
  if (error !== null) throw toError(error, status);
  return count ?? 0;
}
