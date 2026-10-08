import {
  NOT_BLANK,
  bearerSecurity,
  dataResponse,
  errorResponses,
  idParamsSchema,
  listResponse,
  paginationQueryProperties,
} from '../../shared/utils/schemas.js';
import { FILE_PATH_MAX_LENGTH, OWN_FILE_PATH_PATTERN } from '../../shared/utils/storagePaths.js';
import {
  ADMIN_TARGET_STATUSES,
  DOCUMENT_VERIFICATION_STATUSES,
  PRIORITIES,
  REQUEST_STATUSES,
  SCHEDULE_STATUSES,
} from './assistance.types.js';

/*
 * JSON Schemas for the assistance routes (request validation + Swagger). Request bodies use
 * additionalProperties: false, so Fastify strips fields the client may not set (status,
 * beneficiary_id, reviewed_by, verification_status, ...). The length limits are API limits; the text
 * columns have none.
 */

export const DESCRIPTION_MIN_LENGTH = 10;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const TEXT_MAX_LENGTH = 300;

const nullableText = { type: ['string', 'null'] } as const;
const optionalText = { type: ['string', 'null'], maxLength: TEXT_MAX_LENGTH } as const;

const requestProperties = {
  id: { type: 'string', format: 'uuid' },
  beneficiary_id: { type: 'string', format: 'uuid', description: 'beneficiary_profiles.id (not the auth user id)' },
  request_date: { type: 'string', format: 'date-time' },
  request_type: { type: 'string' },
  description: { type: 'string' },
  status: { type: 'string', enum: [...REQUEST_STATUSES] },
  priority: nullableText,
  preferred_collection_area: nullableText,
  admin_notes: nullableText,
  reviewed_by: { type: ['string', 'null'], format: 'uuid', description: 'administrator_profiles.id' },
  reviewed_at: { type: ['string', 'null'], format: 'date-time' },
} as const;

const documentProperties = {
  id: { type: 'string', format: 'uuid' },
  request_id: { type: 'string', format: 'uuid' },
  document_name: { type: 'string' },
  document_type: nullableText,
  file_path: { type: 'string', description: 'Path in the supporting-documents bucket' },
  upload_date: { type: 'string', format: 'date-time' },
  verification_status: { type: 'string', enum: [...DOCUMENT_VERIFICATION_STATUSES] },
} as const;

const scheduleProperties = {
  id: { type: 'string', format: 'uuid' },
  request_id: { type: ['string', 'null'], format: 'uuid' },
  programme_name: nullableText,
  location: { type: 'string' },
  collection_date: { type: 'string', format: 'date' },
  collection_time: nullableText,
  status: { type: 'string', enum: [...SCHEDULE_STATUSES] },
  created_at: { type: 'string', format: 'date-time' },
} as const;

const requestSchema = { type: 'object', required: Object.keys(requestProperties), properties: requestProperties } as const;
const documentSchema = { type: 'object', required: Object.keys(documentProperties), properties: documentProperties } as const;
const scheduleSchema = { type: 'object', required: Object.keys(scheduleProperties), properties: scheduleProperties } as const;

const beneficiaryRef = {
  type: ['object', 'null'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    user_id: { type: 'string', format: 'uuid' },
    profiles: {
      type: ['object', 'null'],
      properties: { full_name: { type: 'string' }, email: { type: 'string' } },
    },
  },
} as const;

const adminRequestSchema = {
  type: 'object',
  required: [...Object.keys(requestProperties), 'beneficiary_profiles'],
  properties: { ...requestProperties, beneficiary_profiles: beneficiaryRef },
} as const;

const myRequestSchema = {
  type: 'object',
  required: [...Object.keys(requestProperties), 'supporting_documents', 'collection_schedules'],
  properties: {
    ...requestProperties,
    supporting_documents: { type: 'array', items: documentSchema },
    collection_schedules: { type: 'array', items: scheduleSchema },
  },
} as const;

const detailSchema = {
  type: 'object',
  required: [...myRequestSchema.required, 'beneficiary_profiles'],
  properties: { ...myRequestSchema.properties, beneficiary_profiles: beneficiaryRef },
} as const;

const adminScheduleSchema = {
  type: 'object',
  required: [...Object.keys(scheduleProperties), 'assistance_requests'],
  properties: {
    ...scheduleProperties,
    assistance_requests: {
      type: ['object', 'null'],
      properties: {
        id: requestProperties.id,
        beneficiary_id: requestProperties.beneficiary_id,
        request_type: requestProperties.request_type,
        status: requestProperties.status,
      },
    },
  },
} as const;

const requestStatusQuery = {
  type: 'object',
  additionalProperties: false,
  properties: { status: { type: 'string', enum: [...REQUEST_STATUSES] }, ...paginationQueryProperties },
} as const;

const security = bearerSecurity;
const tags = ['assistance'];

export const createRequestSchema = {
  tags,
  summary: 'Request assistance (beneficiaries)',
  description: 'Creates a pending request for your beneficiary profile. status and the review fields cannot be set.',
  security,
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['request_type', 'description'],
    properties: {
      request_type: { type: 'string', minLength: 1, maxLength: 100, pattern: NOT_BLANK, description: 'e.g. Food Support' },
      description: { type: 'string', minLength: DESCRIPTION_MIN_LENGTH, maxLength: DESCRIPTION_MAX_LENGTH, pattern: NOT_BLANK },
      priority: { type: 'string', enum: [...PRIORITIES], description: "Defaults to 'normal'" },
      preferred_collection_area: optionalText,
    },
  },
  response: { 201: dataResponse(requestSchema), ...errorResponses() },
} as const;

export const listRequestsSchema = {
  tags,
  summary: 'List assistance requests (administrators)',
  description: 'All requests, newest first, optionally filtered by status, with the beneficiary.',
  security,
  querystring: requestStatusQuery,
  response: { 200: listResponse(adminRequestSchema), ...errorResponses() },
} as const;

export const listMyRequestsSchema = {
  tags,
  summary: 'List my assistance requests (beneficiaries)',
  description: 'Your requests, newest first, with their supporting documents and collection schedules.',
  security,
  querystring: requestStatusQuery,
  response: { 200: listResponse(myRequestSchema), ...errorResponses() },
} as const;

export const getRequestSchema = {
  tags,
  summary: 'Get an assistance request (its beneficiary or an administrator)',
  description: 'Returns 404 both when the request does not exist and when it is not yours.',
  security,
  params: idParamsSchema('Assistance request id'),
  response: { 200: dataResponse(detailSchema), ...errorResponses(404) },
} as const;

export const createDocumentSchema = {
  tags,
  summary: 'Attach a supporting document to my request (beneficiaries)',
  description:
    'Upload the file to your folder in the supporting-documents bucket first. Not allowed for rejected or ' +
    'completed requests (409). The document starts as pending verification.',
  security,
  params: idParamsSchema('Assistance request id'),
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['document_name', 'file_path'],
    properties: {
      document_name: { type: 'string', minLength: 1, maxLength: 200, pattern: NOT_BLANK },
      document_type: { type: ['string', 'null'], maxLength: 100, description: 'e.g. the MIME type' },
      file_path: {
        type: 'string',
        maxLength: FILE_PATH_MAX_LENGTH,
        pattern: OWN_FILE_PATH_PATTERN,
        description: 'Path of the uploaded file in the supporting-documents bucket; must start with your auth user id',
      },
    },
  },
  response: { 201: dataResponse(documentSchema), ...errorResponses(404, 409) },
} as const;

export const updateRequestStatusSchema = {
  tags,
  summary: 'Change the status of an assistance request (administrators)',
  description:
    'Allowed: pending -> under_review | approved | rejected; under_review -> approved | rejected; approved -> ' +
    'completed. Anything else is 409. Records you as the reviewer; the beneficiary is notified by the database.',
  security,
  params: idParamsSchema('Assistance request id'),
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['status'],
    properties: {
      status: { type: 'string', enum: [...ADMIN_TARGET_STATUSES] },
      admin_notes: { type: ['string', 'null'], maxLength: DESCRIPTION_MAX_LENGTH },
    },
  },
  response: { 200: dataResponse(detailSchema), ...errorResponses(404, 409) },
} as const;

export const createScheduleSchema = {
  tags,
  summary: 'Schedule a collection (administrators)',
  description: 'request_id is optional (general programme); when given, the request must be approved (409 otherwise).',
  security,
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['location', 'collection_date'],
    properties: {
      request_id: { type: ['string', 'null'], format: 'uuid' },
      programme_name: { type: ['string', 'null'], maxLength: 200 },
      location: { type: 'string', minLength: 1, maxLength: TEXT_MAX_LENGTH, pattern: NOT_BLANK },
      collection_date: { type: 'string', format: 'date' },
      collection_time: { type: ['string', 'null'], maxLength: 50, description: 'Free text, e.g. 09:00 - 12:00' },
      status: { type: 'string', enum: [...SCHEDULE_STATUSES], default: 'upcoming' },
    },
  },
  response: { 201: dataResponse(scheduleSchema), ...errorResponses(404, 409) },
} as const;

export const listSchedulesSchema = {
  tags,
  summary: 'List collection schedules (administrators)',
  description: 'Earliest collection first, optionally filtered by status or request.',
  security,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      status: { type: 'string', enum: [...SCHEDULE_STATUSES] },
      request_id: { type: 'string', format: 'uuid' },
      ...paginationQueryProperties,
    },
  },
  response: { 200: listResponse(adminScheduleSchema), ...errorResponses() },
} as const;

export const listMySchedulesSchema = {
  tags,
  summary: 'List my collection schedules (beneficiaries)',
  description: 'Collections scheduled for your requests, earliest first.',
  security,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: { status: { type: 'string', enum: [...SCHEDULE_STATUSES] }, ...paginationQueryProperties },
  },
  response: { 200: listResponse(scheduleSchema), ...errorResponses() },
} as const;
