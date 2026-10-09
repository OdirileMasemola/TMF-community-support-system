import {
  NOT_BLANK,
  bearerSecurity,
  dataResponse,
  errorResponses,
  listResponse,
  paginationQuerySchema,
} from '../../shared/utils/schemas.js';
import { REPORT_STATUSES } from './report.types.js';

const reportSchema = {
  type: 'object',
  required: ['id', 'admin_id', 'report_name', 'generated_at', 'report_type', 'status', 'metadata', 'file_path'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    admin_id: { type: 'string', format: 'uuid' },
    report_name: { type: 'string' },
    generated_at: { type: 'string', format: 'date-time' },
    report_type: { type: 'string' },
    status: { type: 'string', enum: [...REPORT_STATUSES] },
    metadata: { type: 'object', additionalProperties: true },
    file_path: { type: ['string', 'null'] },
  },
} as const;

const security = bearerSecurity;
const tags = ['reports'];

export const listReportsSchema = {
  tags,
  summary: 'List reports (administrators)',
  description: 'Newest first. Only administrators can read reports.',
  security,
  querystring: paginationQuerySchema,
  response: { 200: listResponse(reportSchema), ...errorResponses() },
} as const;

export const createReportSchema = {
  tags,
  summary: 'Create a report (administrators)',
  description: 'admin_id is set from the caller\'s administrator profile. status defaults to generated. generated_at is set by the database.',
  security,
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['report_name', 'report_type'],
    properties: {
      report_name: { type: 'string', minLength: 1, maxLength: 200, pattern: NOT_BLANK },
      report_type: { type: 'string', minLength: 1, maxLength: 100, pattern: NOT_BLANK },
      status: { type: 'string', enum: [...REPORT_STATUSES] },
      metadata: { type: 'object', additionalProperties: true },
      file_path: { type: ['string', 'null'], maxLength: 2048 },
    },
  },
  response: { 201: dataResponse(reportSchema), ...errorResponses() },
} as const;
