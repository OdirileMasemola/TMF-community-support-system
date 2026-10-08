import { ACCOUNT_STATUSES, USER_ROLES } from '../../shared/types/auth.types.js';
import {
  bearerSecurity,
  dataResponse,
  errorResponses,
  idParamsSchema,
  listResponse,
  paginationQueryProperties,
} from '../../shared/utils/schemas.js';
import { profileSchema } from '../me/me.schema.js';

/*
 * JSON Schemas for the administration routes (request validation + Swagger).
 */

/** Longest accepted search term. */
export const SEARCH_MAX_LENGTH = 100;
/**
 * Letters, digits, marks, spaces and @ . ' + _ - only. This keeps the term safe inside a PostgREST
 * or=(...) filter (no commas, parentheses or quotes) and rules out the * and % wildcards.
 */
export const SEARCH_PATTERN = "^[\\p{L}\\p{M}\\p{N} @.'+_-]*$";

const count = { type: 'integer', minimum: 0 } as const;
const counts = <const TKeys extends readonly string[]>(keys: TKeys) =>
  ({
    type: 'object',
    required: [...keys],
    properties: Object.fromEntries(keys.map((key) => [key, count])) as Record<TKeys[number], typeof count>,
  }) as const;

const dashboardSchema = {
  type: 'object',
  required: ['users', 'campaigns', 'donations', 'assistanceRequests', 'volunteers', 'sponsorships', 'events'],
  properties: {
    users: {
      type: 'object',
      required: ['total', 'pending', 'suspended', 'byRole'],
      properties: { total: count, pending: count, suspended: count, byRole: counts(USER_ROLES) },
    },
    campaigns: counts(['total', 'active'] as const),
    donations: {
      type: 'object',
      required: ['total', 'successfulAmount', 'pendingProofs'],
      properties: {
        total: count,
        successfulAmount: { type: 'number', description: 'Sum of successful money donations (rand)' },
        pendingProofs: { ...count, description: 'Proofs of payment awaiting review' },
      },
    },
    assistanceRequests: {
      type: 'object',
      required: ['total', 'awaitingReview'],
      properties: { total: count, awaitingReview: { ...count, description: 'pending or under_review' } },
    },
    volunteers: counts(['pendingApplications'] as const),
    sponsorships: {
      type: 'object',
      required: ['total', 'openRequests'],
      properties: { total: count, openRequests: { ...count, description: 'Open sponsorship requests' } },
    },
    events: counts(['scheduled'] as const),
  },
} as const;

const security = bearerSecurity;
const tags = ['admin'];

export const getDashboardSchema = {
  tags,
  summary: 'Dashboard totals (administrators)',
  description: 'Counts across users, campaigns, donations, assistance requests, volunteers, sponsorships and events.',
  security,
  response: { 200: dataResponse(dashboardSchema), ...errorResponses() },
} as const;

export const listUsersSchema = {
  tags,
  summary: 'List users (administrators)',
  description: 'Newest first. Filter by role and account status; search matches full name or email (case-insensitive).',
  security,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      role: { type: 'string', enum: [...USER_ROLES] },
      status: { type: 'string', enum: [...ACCOUNT_STATUSES], description: 'account_status' },
      search: { type: 'string', maxLength: SEARCH_MAX_LENGTH, pattern: SEARCH_PATTERN },
      ...paginationQueryProperties,
    },
  },
  response: { 200: listResponse(profileSchema), ...errorResponses() },
} as const;

export const updateUserStatusSchema = {
  tags,
  summary: "Change a user's account status (administrators)",
  description:
    'Sets account_status to pending, active or suspended. You cannot change your own status (409). ' +
    'Suspended users are refused by the API and by the database policies.',
  security,
  params: idParamsSchema('User id (profiles.id, the auth user id)'),
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['account_status'],
    properties: { account_status: { type: 'string', enum: [...ACCOUNT_STATUSES] } },
  },
  response: { 200: dataResponse(profileSchema), ...errorResponses(404, 409) },
} as const;
