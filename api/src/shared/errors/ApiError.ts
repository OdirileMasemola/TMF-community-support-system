import { ErrorCodes, type ErrorCode } from './errorCodes.js';

/**
 * Expected, intentional API error. Its message is safe to return to clients.
 * Anything that is not an ApiError is treated as unexpected (logged, generic 500 response).
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;

  constructor(statusCode: number, code: ErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }

  static badRequest(message = 'Bad request'): ApiError {
    return new ApiError(400, ErrorCodes.BAD_REQUEST, message);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, ErrorCodes.UNAUTHORIZED, message);
  }

  static forbidden(message = 'You do not have permission to perform this action'): ApiError {
    return new ApiError(403, ErrorCodes.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, ErrorCodes.NOT_FOUND, message);
  }

  static notImplemented(message = 'Not implemented'): ApiError {
    return new ApiError(501, ErrorCodes.NOT_IMPLEMENTED, message);
  }
}
