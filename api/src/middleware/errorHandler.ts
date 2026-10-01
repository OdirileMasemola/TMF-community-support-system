import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ApiError } from '../shared/errors/ApiError.js';
import { ErrorCodes, errorCodeForStatus } from '../shared/errors/errorCodes.js';
import { errorResponse } from '../shared/utils/response.js';

interface HttpLikeError {
  statusCode: unknown;
  validation: unknown;
  message: unknown;
}

/** Reads the fields Fastify/plugin errors use, without trusting their types. */
function toHttpLikeError(error: unknown): HttpLikeError {
  if (typeof error !== 'object' || error === null) {
    return { statusCode: undefined, validation: undefined, message: undefined };
  }
  return {
    statusCode: 'statusCode' in error ? error.statusCode : undefined,
    validation: 'validation' in error ? error.validation : undefined,
    message: 'message' in error ? error.message : undefined,
  };
}

/**
 * Centralised error handler. Every error response has the shape
 * `{ "error": { "code": string, "message": string } }` and never includes stack traces.
 */
export function errorHandler(error: unknown, request: FastifyRequest, reply: FastifyReply): FastifyReply {
  // 1. Intentional API errors: safe to expose as-is.
  if (error instanceof ApiError) {
    if (error.statusCode >= 500) request.log.error({ err: error }, error.message);
    return reply.status(error.statusCode).send(errorResponse(error.code, error.message));
  }

  const httpError = toHttpLikeError(error);
  const message = typeof httpError.message === 'string' ? httpError.message : '';

  // 2. Fastify schema validation errors.
  if (httpError.validation !== undefined) {
    return reply.status(400).send(errorResponse(ErrorCodes.VALIDATION_ERROR, message || 'Invalid request'));
  }

  // 3. Client errors raised by Fastify or its plugins (bad JSON, 413, 415, 429 rate limit, ...).
  const statusCode = typeof httpError.statusCode === 'number' ? httpError.statusCode : 500;
  if (statusCode >= 400 && statusCode < 500) {
    return reply.status(statusCode).send(errorResponse(errorCodeForStatus(statusCode), message || 'Bad request'));
  }

  // 4. Unexpected errors: log details server-side, return a generic message.
  request.log.error({ err: error }, 'Unhandled error');
  return reply.status(500).send(errorResponse(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred'));
}

/** 404 handler using the same error shape. */
export function notFoundHandler(request: FastifyRequest, reply: FastifyReply): FastifyReply {
  return reply
    .status(404)
    .send(errorResponse(ErrorCodes.NOT_FOUND, `Route ${request.method} ${request.url.split('?')[0] ?? ''} not found`));
}

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);
}
