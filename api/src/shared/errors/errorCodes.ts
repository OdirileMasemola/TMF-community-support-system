/** Stable, machine-readable error codes returned in `{ error: { code, message } }`. */
export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

const STATUS_TO_CODE: Readonly<Record<number, ErrorCode>> = {
  400: ErrorCodes.BAD_REQUEST,
  401: ErrorCodes.UNAUTHORIZED,
  403: ErrorCodes.FORBIDDEN,
  404: ErrorCodes.NOT_FOUND,
  405: ErrorCodes.METHOD_NOT_ALLOWED,
  409: ErrorCodes.CONFLICT,
  413: ErrorCodes.PAYLOAD_TOO_LARGE,
  415: ErrorCodes.UNSUPPORTED_MEDIA_TYPE,
  429: ErrorCodes.RATE_LIMITED,
  501: ErrorCodes.NOT_IMPLEMENTED,
  503: ErrorCodes.SERVICE_UNAVAILABLE,
};

/** Maps an HTTP status code to the closest generic error code. */
export function errorCodeForStatus(statusCode: number): ErrorCode {
  return STATUS_TO_CODE[statusCode] ?? (statusCode >= 500 ? ErrorCodes.INTERNAL_ERROR : ErrorCodes.BAD_REQUEST);
}
