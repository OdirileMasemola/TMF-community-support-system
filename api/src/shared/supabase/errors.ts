import type { PostgrestError } from '@supabase/supabase-js';
import { ApiError } from '../errors/ApiError.js';
import { ErrorCodes } from '../errors/errorCodes.js';

/** Postgres error codes caused by invalid input values. */
const INVALID_DATA_CODES = new Set(['22P02', '22003', '22007', '22008', '23502', '23514']);
/** PostgREST JWT errors. */
const JWT_ERROR_CODES = new Set(['PGRST301', 'PGRST302', 'PGRST303']);

/**
 * Maps a PostgREST/Postgres error to a safe ApiError, using the same rules as the campaigns module
 * (which keeps its own copy). The raw error is only attached as `cause` (logged server-side for
 * 5xx), never returned to the client.
 *
 * @param resource Lower-case resource name used in messages, e.g. "donation".
 * @param action   Verb used in the generic 500 message, e.g. "create".
 */
export function toApiError(error: PostgrestError, status: number, action: string, resource: string): ApiError {
  const options = { cause: error };
  if (status === 0 || status >= 500) {
    return new ApiError(503, ErrorCodes.SERVICE_UNAVAILABLE, 'The data service is unavailable', options);
  }
  if (status === 401 || JWT_ERROR_CODES.has(error.code)) {
    return new ApiError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired access token', options);
  }
  if (error.code === '42501' || status === 403) {
    // Row Level Security, a missing grant or a database trigger rejected the operation.
    return new ApiError(403, ErrorCodes.FORBIDDEN, 'You do not have permission to perform this action', options);
  }
  if (INVALID_DATA_CODES.has(error.code)) {
    return new ApiError(400, ErrorCodes.VALIDATION_ERROR, `Invalid ${resource} data`, options);
  }
  if (error.code === '23503' || error.code === '23505') {
    return new ApiError(409, ErrorCodes.CONFLICT, `The ${resource} conflicts with existing data`, options);
  }
  return new ApiError(500, ErrorCodes.INTERNAL_ERROR, `Unable to ${action} ${resource}`, options);
}

/** 400 VALIDATION_ERROR with a message that is safe to show. */
export function validationError(message: string): ApiError {
  return new ApiError(400, ErrorCodes.VALIDATION_ERROR, message);
}

/** 409 CONFLICT with a message that is safe to show. */
export function conflictError(message: string): ApiError {
  return new ApiError(409, ErrorCodes.CONFLICT, message);
}
