import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../shared/utils/pagination.js';
import { ERROR_RESPONSE_SCHEMA_REF } from '../../shared/utils/response.js';
import { CAMPAIGN_STATUSES } from './campaign.types.js';

/*
 * JSON Schemas for the campaign routes (Fastify validates requests with them and Swagger is
 * generated from them). The text columns of public.campaigns have no length constraints in the
 * database; the maxLength values below are API limits. funding_goal follows the live CHECK
 * constraint campaigns_funding_goal_non_negative (NULL or >= 0). Required fields are the NOT NULL
 * columns without a default (title, description, location, start_date); status and is_public are
 * optional and use the column defaults. Request bodies use additionalProperties: false, so Fastify
 * strips fields that are not listed (id, admin_id, amount_raised, created_at, updated_at, role, ...);
 * the service also copies only the writable fields.
 */

export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 5000;
export const LOCATION_MAX_LENGTH = 200;
export const CATEGORY_MAX_LENGTH = 100;
export const IMAGE_URL_MAX_LENGTH = 2048;
export const MIN_FUNDING_GOAL = 0;

/** At least one non-whitespace character. */
const NOT_BLANK = '\\S';

const campaignSchema = {
  type: 'object',
  required: [
    'id',
    'admin_id',
    'title',
    'description',
    'location',
    'start_date',
    'end_date',
    'status',
    'category',
    'image_url',
    'funding_goal',
    'amount_raised',
    'is_public',
    'created_at',
    'updated_at',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    admin_id: { type: 'string', format: 'uuid', description: 'Administrator profile of the creator (server-set).' },
    title: { type: 'string' },
    description: { type: 'string' },
    location: { type: 'string' },
    start_date: { type: 'string', format: 'date' },
    end_date: { type: ['string', 'null'], format: 'date' },
    status: { type: 'string', enum: [...CAMPAIGN_STATUSES] },
    category: { type: ['string', 'null'] },
    image_url: { type: ['string', 'null'] },
    funding_goal: { type: ['number', 'null'] },
    amount_raised: { type: 'number', description: 'Calculated by the database from successful money donations.' },
    is_public: { type: 'boolean' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
} as const;

const writableProperties = {
  title: { type: 'string', minLength: 1, maxLength: TITLE_MAX_LENGTH, pattern: NOT_BLANK },
  description: { type: 'string', minLength: 1, maxLength: DESCRIPTION_MAX_LENGTH, pattern: NOT_BLANK },
  location: { type: 'string', minLength: 1, maxLength: LOCATION_MAX_LENGTH, pattern: NOT_BLANK },
  start_date: { type: 'string', format: 'date', description: 'YYYY-MM-DD' },
  end_date: { type: ['string', 'null'], format: 'date', description: 'YYYY-MM-DD, on or after start_date' },
  status: { type: 'string', enum: [...CAMPAIGN_STATUSES] },
  category: { type: ['string', 'null'], maxLength: CATEGORY_MAX_LENGTH },
  image_url: {
    type: ['string', 'null'],
    format: 'uri',
    pattern: '^https?://',
    maxLength: IMAGE_URL_MAX_LENGTH,
    description: 'http(s) URL, e.g. the public URL of a file in the campaign-images bucket',
  },
  funding_goal: { type: ['number', 'null'], minimum: MIN_FUNDING_GOAL, description: 'Amount >= 0, or null' },
  is_public: { type: 'boolean' },
} as const;

const createCampaignBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'description', 'location', 'start_date'],
  properties: writableProperties,
} as const;

const updateCampaignBodySchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: writableProperties,
} as const;

const campaignIdParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', format: 'uuid', description: 'Campaign id' },
  },
} as const;

const listCampaignsQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    page: { type: 'integer', minimum: 1, default: DEFAULT_PAGE },
    pageSize: { type: 'integer', minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE },
  },
} as const;

const singleCampaignResponseSchema = {
  type: 'object',
  required: ['data'],
  properties: { data: campaignSchema },
} as const;

const campaignListResponseSchema = {
  type: 'object',
  required: ['data', 'meta'],
  properties: {
    data: { type: 'array', items: campaignSchema },
    meta: {
      type: 'object',
      required: ['page', 'pageSize', 'total', 'totalPages'],
      properties: {
        page: { type: 'integer' },
        pageSize: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
      },
    },
  },
} as const;

const security = [{ bearerAuth: [] }];
const tags = ['campaigns'];

export const listCampaignsSchema = {
  tags,
  summary: 'List campaigns',
  description:
    'Paginated list, newest first. Requires a signed-in, non-suspended account (anon has no SELECT ' +
    'grant on campaigns). Only rows that Row Level Security lets the caller see are returned: ' +
    'administrators see all campaigns, other users see active campaigns.',
  security,
  querystring: listCampaignsQuerySchema,
  response: {
    200: campaignListResponseSchema,
    400: ERROR_RESPONSE_SCHEMA_REF,
    401: ERROR_RESPONSE_SCHEMA_REF,
    403: ERROR_RESPONSE_SCHEMA_REF,
    500: ERROR_RESPONSE_SCHEMA_REF,
    503: ERROR_RESPONSE_SCHEMA_REF,
  },
} as const;

export const getCampaignSchema = {
  tags,
  summary: 'Get a campaign',
  description: 'Returns 404 both when the campaign does not exist and when Row Level Security hides it.',
  security,
  params: campaignIdParamsSchema,
  response: {
    200: singleCampaignResponseSchema,
    400: ERROR_RESPONSE_SCHEMA_REF,
    401: ERROR_RESPONSE_SCHEMA_REF,
    403: ERROR_RESPONSE_SCHEMA_REF,
    404: ERROR_RESPONSE_SCHEMA_REF,
    500: ERROR_RESPONSE_SCHEMA_REF,
    503: ERROR_RESPONSE_SCHEMA_REF,
  },
} as const;

export const createCampaignSchema = {
  tags,
  summary: 'Create a campaign (administrator)',
  description:
    'admin_id is set from the caller\'s administrator profile. id, admin_id, amount_raised, created_at ' +
    'and updated_at are not accepted (unknown fields are ignored). Omitted optional fields use the ' +
    'database defaults.',
  security,
  body: createCampaignBodySchema,
  response: {
    201: singleCampaignResponseSchema,
    400: ERROR_RESPONSE_SCHEMA_REF,
    401: ERROR_RESPONSE_SCHEMA_REF,
    403: ERROR_RESPONSE_SCHEMA_REF,
    409: ERROR_RESPONSE_SCHEMA_REF,
    500: ERROR_RESPONSE_SCHEMA_REF,
    503: ERROR_RESPONSE_SCHEMA_REF,
  },
} as const;

export const updateCampaignSchema = {
  tags,
  summary: 'Update a campaign (administrator)',
  description:
    'Partial update; at least one writable field is required. id, admin_id, amount_raised, created_at ' +
    'and updated_at cannot be changed (unknown fields are ignored).',
  security,
  params: campaignIdParamsSchema,
  body: updateCampaignBodySchema,
  response: {
    200: singleCampaignResponseSchema,
    400: ERROR_RESPONSE_SCHEMA_REF,
    401: ERROR_RESPONSE_SCHEMA_REF,
    403: ERROR_RESPONSE_SCHEMA_REF,
    404: ERROR_RESPONSE_SCHEMA_REF,
    409: ERROR_RESPONSE_SCHEMA_REF,
    500: ERROR_RESPONSE_SCHEMA_REF,
    503: ERROR_RESPONSE_SCHEMA_REF,
  },
} as const;

export const archiveCampaignSchema = {
  tags,
  summary: 'Archive a campaign (administrator)',
  description:
    'Soft delete: sets status to "cancelled" and returns the campaign. Campaigns are never hard-deleted: ' +
    'that would cascade-delete volunteer applications and assignments and unlink donations, sponsorships, ' +
    'events and sponsorship requests (ON DELETE SET NULL), and the database grants no DELETE on campaigns ' +
    'to signed-in users.',
  security,
  params: campaignIdParamsSchema,
  response: {
    200: singleCampaignResponseSchema,
    400: ERROR_RESPONSE_SCHEMA_REF,
    401: ERROR_RESPONSE_SCHEMA_REF,
    403: ERROR_RESPONSE_SCHEMA_REF,
    404: ERROR_RESPONSE_SCHEMA_REF,
    500: ERROR_RESPONSE_SCHEMA_REF,
    503: ERROR_RESPONSE_SCHEMA_REF,
  },
} as const;
