import {
  NOT_BLANK,
  bearerSecurity,
  dataResponse,
  errorResponses,
  idParamsSchema,
  listResponse,
  paginationQueryProperties,
} from '../../shared/utils/schemas.js';
import { EVENT_STATUSES } from './event.types.js';

const nullableText = { type: ['string', 'null'] } as const;

const eventSchema = {
  type: 'object',
  required: ['id', 'admin_id', 'campaign_id', 'title', 'description', 'location', 'event_date', 'status', 'created_at', 'updated_at'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    admin_id: { type: 'string', format: 'uuid' },
    campaign_id: { type: ['string', 'null'], format: 'uuid' },
    title: { type: 'string' },
    description: nullableText,
    location: { type: 'string' },
    event_date: { type: 'string', format: 'date-time' },
    status: { type: 'string', enum: [...EVENT_STATUSES] },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
} as const;

const writable = {
  title: { type: 'string', minLength: 1, maxLength: 200, pattern: NOT_BLANK },
  description: { type: ['string', 'null'], maxLength: 2000 },
  location: { type: 'string', minLength: 1, maxLength: 200, pattern: NOT_BLANK },
  event_date: { type: 'string', minLength: 10, maxLength: 40, description: 'YYYY-MM-DD or an ISO date-time' },
  campaign_id: { type: ['string', 'null'], format: 'uuid' },
  status: { type: 'string', enum: [...EVENT_STATUSES] },
} as const;

const security = bearerSecurity;
const tags = ['events'];

export const listEventsSchema = {
  tags,
  summary: 'List events',
  description: 'Earliest first. Administrators see every event; other signed-in users see scheduled events.',
  security,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: { status: { type: 'string', enum: [...EVENT_STATUSES] }, ...paginationQueryProperties },
  },
  response: { 200: listResponse(eventSchema), ...errorResponses() },
} as const;

export const createEventSchema = {
  tags,
  summary: 'Create an event (administrators)',
  description: 'admin_id is set from the caller\'s administrator profile. status defaults to draft.',
  security,
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'location', 'event_date'],
    properties: writable,
  },
  response: { 201: dataResponse(eventSchema), ...errorResponses(404) },
} as const;

export const updateEventSchema = {
  tags,
  summary: 'Update an event (administrators)',
  description: 'Partial update. id, admin_id, created_at and updated_at cannot be changed.',
  security,
  params: idParamsSchema('Event id'),
  body: { type: 'object', additionalProperties: false, minProperties: 1, properties: writable },
  response: { 200: dataResponse(eventSchema), ...errorResponses(404) },
} as const;
