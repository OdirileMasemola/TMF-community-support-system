import {
  bearerSecurity,
  dataResponse,
  errorResponses,
  idParamsSchema,
  listResponse,
  paginationQueryProperties,
} from '../../shared/utils/schemas.js';
import { CAMPAIGN_STATUSES } from '../campaigns/campaign.types.js';
import { AMOUNT_MAX, NOTES_MAX_LENGTH } from '../donations/donation.schema.js';
import { REQUEST_STATUSES, SPONSORSHIP_STATUSES } from './sponsorship.types.js';

/*
 * JSON Schemas for the sponsorship routes (request validation + Swagger). Request bodies use
 * additionalProperties: false, so Fastify strips fields the client may not set (status, sponsor_id,
 * request_id, ...). The length limits are API limits; the text columns have none.
 */

const nullableText = { type: ['string', 'null'] } as const;
const uuid = { type: 'string', format: 'uuid' } as const;

const sponsorshipProperties = {
  id: uuid,
  sponsor_id: { ...uuid, description: 'sponsor_profiles.id (not the auth user id)' },
  campaign_id: { type: ['string', 'null'], format: 'uuid' },
  amount: { type: 'number' },
  sponsorship_date: { type: 'string', format: 'date-time' },
  sponsorship_type: nullableText,
  status: { type: 'string', enum: [...SPONSORSHIP_STATUSES] },
} as const;

const requestProperties = {
  id: uuid,
  campaign_id: { type: ['string', 'null'], format: 'uuid' },
  title: { type: 'string' },
  requested_support: { type: 'string' },
  category: nullableText,
  priority: nullableText,
  deadline: { type: ['string', 'null'], format: 'date' },
  estimated_impact: nullableText,
  status: { type: 'string', enum: [...REQUEST_STATUSES] },
  created_by: { type: ['string', 'null'], format: 'uuid' },
  created_at: { type: 'string', format: 'date-time' },
} as const;

const responseProperties = {
  id: uuid,
  request_id: uuid,
  sponsor_id: uuid,
  sponsorship_id: { type: ['string', 'null'], format: 'uuid' },
  status: { type: 'string' },
  notes: nullableText,
  responded_at: { type: 'string', format: 'date-time' },
} as const;

const sponsorshipSchema = { type: 'object', required: Object.keys(sponsorshipProperties), properties: sponsorshipProperties } as const;
const responseSchema = { type: 'object', required: Object.keys(responseProperties), properties: responseProperties } as const;

const mySponsorshipSchema = {
  type: 'object',
  required: [...Object.keys(sponsorshipProperties), 'campaigns'],
  properties: {
    ...sponsorshipProperties,
    campaigns: {
      type: ['object', 'null'],
      description: 'null for general sponsorships and campaigns that are no longer active',
      properties: {
        id: uuid,
        title: { type: 'string' },
        category: nullableText,
        status: { type: 'string', enum: [...CAMPAIGN_STATUSES] },
        image_url: nullableText,
        funding_goal: { type: ['number', 'null'] },
        amount_raised: { type: 'number' },
        start_date: { type: 'string', format: 'date' },
        end_date: { type: ['string', 'null'], format: 'date' },
      },
    },
  },
} as const;

const adminSponsorshipSchema = {
  type: 'object',
  required: [...Object.keys(sponsorshipProperties), 'campaigns', 'sponsor_profiles'],
  properties: {
    ...sponsorshipProperties,
    campaigns: { type: ['object', 'null'], properties: { id: uuid, title: { type: 'string' } } },
    sponsor_profiles: {
      type: ['object', 'null'],
      properties: {
        id: uuid,
        organisation_name: { type: 'string' },
        sponsorship_type: nullableText,
        sponsor_level: nullableText,
        profiles: { type: ['object', 'null'], properties: { email: { type: 'string' } } },
      },
    },
  },
} as const;

const requestSchema = {
  type: 'object',
  required: [...Object.keys(requestProperties), 'campaigns'],
  properties: {
    ...requestProperties,
    campaigns: { type: ['object', 'null'], properties: { id: uuid, title: { type: 'string' } } },
  },
} as const;

const sponsorshipStatusQuery = {
  type: 'object',
  additionalProperties: false,
  properties: { status: { type: 'string', enum: [...SPONSORSHIP_STATUSES] }, ...paginationQueryProperties },
} as const;

const security = bearerSecurity;
const tags = ['sponsorships'];

export const createSponsorshipSchema = {
  tags,
  summary: 'Pledge a sponsorship (sponsors)',
  description: 'Creates a pending sponsorship for your sponsor profile. status and sponsor_id cannot be set.',
  security,
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['amount'],
    properties: {
      amount: { type: 'number', exclusiveMinimum: 0, maximum: AMOUNT_MAX, description: 'Rand, at most two decimals' },
      campaign_id: { type: ['string', 'null'], format: 'uuid', description: 'An active campaign; omit or null for a general sponsorship' },
      sponsorship_type: { type: ['string', 'null'], maxLength: 100, description: 'e.g. financial' },
    },
  },
  response: { 201: dataResponse(sponsorshipSchema), ...errorResponses(404) },
} as const;

export const listSponsorshipsSchema = {
  tags,
  summary: 'List sponsorships (administrators)',
  description: 'Newest first, optionally filtered by status, with the campaign and sponsor.',
  security,
  querystring: sponsorshipStatusQuery,
  response: { 200: listResponse(adminSponsorshipSchema), ...errorResponses() },
} as const;

export const listMySponsorshipsSchema = {
  tags,
  summary: 'List my sponsorships (sponsors)',
  security,
  querystring: sponsorshipStatusQuery,
  response: { 200: listResponse(mySponsorshipSchema), ...errorResponses() },
} as const;

export const listRequestsSchema = {
  tags,
  summary: 'List sponsorship requests (sponsors and administrators)',
  description: 'Newest first. Sponsors only ever see open requests; administrators see all and can filter by status.',
  security,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: { status: { type: 'string', enum: [...REQUEST_STATUSES] }, ...paginationQueryProperties },
  },
  response: { 200: listResponse(requestSchema), ...errorResponses() },
} as const;

export const createResponseSchema = {
  tags,
  summary: 'Respond to an open sponsorship request (sponsors)',
  description:
    "Registers your interest (status 'interested'). One response per request (409). sponsorship_id, if given, " +
    'must be one of your sponsorships.',
  security,
  params: idParamsSchema('Sponsorship request id'),
  body: {
    type: 'object',
    additionalProperties: false,
    properties: {
      notes: { type: ['string', 'null'], maxLength: NOTES_MAX_LENGTH },
      sponsorship_id: { type: ['string', 'null'], format: 'uuid' },
    },
  },
  response: { 201: dataResponse(responseSchema), ...errorResponses(404, 409) },
} as const;
