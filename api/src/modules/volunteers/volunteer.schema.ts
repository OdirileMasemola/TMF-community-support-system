import {
  bearerSecurity,
  dataResponse,
  errorResponses,
  idParamsSchema,
  listResponse,
  paginationMetaProperties,
  paginationQueryProperties,
  paginationQuerySchema,
} from '../../shared/utils/schemas.js';
import { CAMPAIGN_STATUSES } from '../campaigns/campaign.types.js';
import {
  APPLICATION_DECISIONS,
  APPLICATION_STATUSES,
  ASSIGNMENT_STATUSES,
  MAX_HOURS,
  MIN_HOURS,
} from './volunteer.types.js';

/*
 * JSON Schemas for the volunteer routes (request validation + Swagger). Request bodies use
 * additionalProperties: false, so Fastify strips fields the client may not set (status,
 * volunteer_id, ...). The length limits are API limits; the text columns have none.
 */

export const NOTES_MAX_LENGTH = 1000;
export const ROLE_MAX_LENGTH = 100;

const nullableText = { type: ['string', 'null'] } as const;
const uuid = { type: 'string', format: 'uuid' } as const;

const opportunitySchema = {
  type: 'object',
  required: ['id', 'title', 'description', 'location', 'start_date', 'status', 'hasApplied', 'application_status'],
  properties: {
    id: uuid,
    admin_id: uuid,
    title: { type: 'string' },
    description: { type: 'string' },
    location: { type: 'string' },
    start_date: { type: 'string', format: 'date' },
    end_date: { type: ['string', 'null'], format: 'date' },
    status: { type: 'string', enum: [...CAMPAIGN_STATUSES] },
    category: nullableText,
    image_url: nullableText,
    funding_goal: { type: ['number', 'null'] },
    amount_raised: { type: 'number' },
    is_public: { type: 'boolean' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    hasApplied: { type: 'boolean', description: 'Whether you have applied to this campaign' },
    application_status: { type: ['string', 'null'], enum: [...APPLICATION_STATUSES, null] },
  },
} as const;

const applicationProperties = {
  id: uuid,
  volunteer_id: { ...uuid, description: 'volunteer_profiles.id (not the auth user id)' },
  campaign_id: uuid,
  application_date: { type: 'string', format: 'date-time' },
  status: { type: 'string', enum: [...APPLICATION_STATUSES] },
  participation_role: nullableText,
} as const;

const assignmentProperties = {
  id: uuid,
  application_id: { type: ['string', 'null'], format: 'uuid' },
  volunteer_id: uuid,
  campaign_id: uuid,
  role: { type: 'string' },
  location: nullableText,
  schedule: nullableText,
  start_date: { type: ['string', 'null'], format: 'date' },
  end_date: { type: ['string', 'null'], format: 'date' },
  status: { type: 'string', enum: [...ASSIGNMENT_STATUSES] },
  created_at: { type: 'string', format: 'date-time' },
} as const;

const hoursProperties = {
  id: uuid,
  assignment_id: { type: ['string', 'null'], format: 'uuid' },
  volunteer_id: uuid,
  hours: { type: 'number' },
  work_date: { type: 'string', format: 'date' },
  notes: nullableText,
  recorded_at: { type: 'string', format: 'date-time' },
} as const;

const applicationSchema = { type: 'object', required: Object.keys(applicationProperties), properties: applicationProperties } as const;
const assignmentSchema = { type: 'object', required: Object.keys(assignmentProperties), properties: assignmentProperties } as const;
const hoursSchema = { type: 'object', required: Object.keys(hoursProperties), properties: hoursProperties } as const;

const volunteerRef = {
  type: ['object', 'null'],
  properties: {
    id: uuid,
    user_id: uuid,
    profiles: { type: ['object', 'null'], properties: { full_name: { type: 'string' }, email: { type: 'string' } } },
  },
} as const;

const myApplicationSchema = {
  type: 'object',
  required: [...Object.keys(applicationProperties), 'campaigns'],
  properties: {
    ...applicationProperties,
    campaigns: {
      type: ['object', 'null'],
      description: 'null when the campaign is no longer active (hidden from volunteers)',
      properties: {
        id: uuid,
        title: { type: 'string' },
        category: nullableText,
        location: { type: 'string' },
        status: { type: 'string', enum: [...CAMPAIGN_STATUSES] },
      },
    },
  },
} as const;

const adminApplicationProperties = {
  ...applicationProperties,
  campaigns: { type: ['object', 'null'], properties: { id: uuid, title: { type: 'string' } } },
  volunteer_profiles: volunteerRef,
} as const;

const adminApplicationSchema = {
  type: 'object',
  required: Object.keys(adminApplicationProperties),
  properties: adminApplicationProperties,
} as const;

const reviewedApplicationSchema = {
  type: 'object',
  required: [...Object.keys(adminApplicationProperties), 'assignment'],
  properties: {
    ...adminApplicationProperties,
    assignment: { ...assignmentSchema, type: ['object', 'null'], description: 'The assignment of an approved application; null when rejected' },
  },
} as const;

const myAssignmentSchema = {
  type: 'object',
  required: [...Object.keys(assignmentProperties), 'campaigns'],
  properties: {
    ...assignmentProperties,
    campaigns: {
      type: ['object', 'null'],
      description: 'null when the campaign is no longer active (hidden from volunteers)',
      properties: { id: uuid, title: { type: 'string' }, category: nullableText, location: { type: 'string' }, image_url: nullableText },
    },
  },
} as const;

const adminHoursSchema = {
  type: 'object',
  required: [...Object.keys(hoursProperties), 'volunteer_assignments', 'volunteer_profiles'],
  properties: {
    ...hoursProperties,
    volunteer_assignments: { type: ['object', 'null'], properties: { id: uuid, role: { type: 'string' }, campaign_id: uuid } },
    volunteer_profiles: volunteerRef,
  },
} as const;

const security = bearerSecurity;
const tags = ['volunteers'];

export const listOpportunitiesSchema = {
  tags,
  summary: 'List volunteer opportunities (volunteers)',
  description: 'Active campaigns, earliest start first, with whether (and with what status) you have applied.',
  security,
  querystring: paginationQuerySchema,
  response: { 200: listResponse(opportunitySchema), ...errorResponses() },
} as const;

export const applySchema = {
  tags,
  summary: 'Apply to volunteer for a campaign (volunteers)',
  description: 'The campaign must be active (404 otherwise). One application per campaign (409). Starts as pending.',
  security,
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['campaign_id'],
    properties: {
      campaign_id: uuid,
      participation_role: { type: ['string', 'null'], maxLength: ROLE_MAX_LENGTH, description: 'e.g. Driver; becomes the assignment role' },
    },
  },
  response: { 201: dataResponse(applicationSchema), ...errorResponses(404, 409) },
} as const;

export const listApplicationsSchema = {
  tags,
  summary: 'List campaign applications (administrators)',
  description: 'Newest first, optionally filtered by status or campaign, with the campaign and the volunteer.',
  security,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      status: { type: 'string', enum: [...APPLICATION_STATUSES] },
      campaign_id: uuid,
      ...paginationQueryProperties,
    },
  },
  response: { 200: listResponse(adminApplicationSchema), ...errorResponses() },
} as const;

export const listMyApplicationsSchema = {
  tags,
  summary: 'List my campaign applications (volunteers)',
  security,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: { status: { type: 'string', enum: [...APPLICATION_STATUSES] }, ...paginationQueryProperties },
  },
  response: { 200: listResponse(myApplicationSchema), ...errorResponses() },
} as const;

export const reviewApplicationSchema = {
  tags,
  summary: 'Approve or reject a campaign application (administrators)',
  description:
    'Only pending applications can be reviewed (409 otherwise). Approving creates the volunteer assignment ' +
    '(role = participation_role or "Volunteer", status upcoming); approving an approved application again only ' +
    'creates a missing assignment. The volunteer is notified by the database.',
  security,
  params: idParamsSchema('Campaign application id'),
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['status'],
    properties: { status: { type: 'string', enum: [...APPLICATION_DECISIONS] } },
  },
  response: { 200: dataResponse(reviewedApplicationSchema), ...errorResponses(404, 409) },
} as const;

export const listMyAssignmentsSchema = {
  tags,
  summary: 'List my volunteer assignments (volunteers)',
  security,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: { status: { type: 'string', enum: [...ASSIGNMENT_STATUSES] }, ...paginationQueryProperties },
  },
  response: { 200: listResponse(myAssignmentSchema), ...errorResponses() },
} as const;

export const recordHoursSchema = {
  tags,
  summary: 'Record volunteer hours (volunteers)',
  description: `hours between ${MIN_HOURS} and ${MAX_HOURS} (two decimals), work_date not in the future. assignment_id, if given, must be one of your assignments.`,
  security,
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['hours', 'work_date'],
    properties: {
      hours: { type: 'number', minimum: MIN_HOURS, maximum: MAX_HOURS },
      work_date: { type: 'string', format: 'date' },
      assignment_id: { type: ['string', 'null'], format: 'uuid' },
      notes: { type: ['string', 'null'], maxLength: NOTES_MAX_LENGTH },
    },
  },
  response: { 201: dataResponse(hoursSchema), ...errorResponses(404) },
} as const;

export const listHoursSchema = {
  tags,
  summary: 'List volunteer hours (administrators)',
  description: 'Latest work date first, optionally for one volunteer (volunteer_profiles.id).',
  security,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: { volunteer_id: uuid, ...paginationQueryProperties },
  },
  response: { 200: listResponse(adminHoursSchema), ...errorResponses() },
} as const;

export const listMyHoursSchema = {
  tags,
  summary: 'List my volunteer hours (volunteers)',
  description: 'Latest work date first. meta.totalHours is all your hours, meta.thisMonthHours those in the current month.',
  security,
  querystring: paginationQuerySchema,
  response: {
    200: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: { type: 'array', items: hoursSchema },
        meta: {
          type: 'object',
          required: ['page', 'pageSize', 'total', 'totalPages', 'totalHours', 'thisMonthHours'],
          properties: {
            ...paginationMetaProperties,
            totalHours: { type: 'number' },
            thisMonthHours: { type: 'number', description: 'Current month in Africa/Johannesburg' },
          },
        },
      },
    },
    ...errorResponses(),
  },
} as const;
