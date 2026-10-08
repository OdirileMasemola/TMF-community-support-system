import { USER_ROLES, ACCOUNT_STATUSES } from '../../shared/types/auth.types.js';
import { NOT_BLANK, bearerSecurity, dataResponse, errorResponses } from '../../shared/utils/schemas.js';
import { SELF_SERVICE_ROLES, THEME_PREFERENCES } from './me.types.js';

/*
 * JSON Schemas for /me. Text columns have no length constraints in the database; the maxLength
 * values are API limits. Request bodies use additionalProperties: false, so Fastify strips unknown
 * fields (id, email, role, account_status, user_id, ...); the service also copies only allowed fields.
 */

export const FULL_NAME_MAX_LENGTH = 120;
export const TEXT_MAX_LENGTH = 300;
export const URL_MAX_LENGTH = 2048;
/** Digits, spaces, +, -, ( and ); 6 to 20 characters. */
export const PHONE_PATTERN = '^\\+?[0-9 ()-]{6,20}$';

const nullableText = { type: ['string', 'null'] } as const;

export const profileSchema = {
  type: 'object',
  required: ['id', 'role', 'full_name', 'email', 'phone_number', 'account_status', 'created_at', 'updated_at'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    role: { type: 'string', enum: [...USER_ROLES] },
    full_name: { type: 'string' },
    email: { type: 'string' },
    phone_number: nullableText,
    account_status: { type: 'string', enum: [...ACCOUNT_STATUSES] },
    avatar_url: nullableText,
    invited_by: { type: ['string', 'null'], format: 'uuid' },
    invited_at: { type: ['string', 'null'], format: 'date-time' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
} as const;

const roleProfileSchema = {
  type: ['object', 'null'],
  description: 'Row of the role profile table for profile.role (fields depend on the role); null if missing.',
  properties: {
    id: { type: 'string', format: 'uuid' },
    user_id: { type: 'string', format: 'uuid' },
    created_at: { type: 'string', format: 'date-time' },
    // donor
    donation_preference: nullableText,
    member_since: { type: ['string', 'null'], format: 'date' },
    // donor, beneficiary, volunteer
    avatar_url: nullableText,
    // beneficiary, volunteer
    residential_address: nullableText,
    // beneficiary
    assistance_type: nullableText,
    eligibility_status: nullableText,
    // volunteer
    availability_status: nullableText,
    preferred_area: nullableText,
    status: nullableText,
    // sponsor
    organisation_name: { type: 'string' },
    sponsorship_type: nullableText,
    representative_name: nullableText,
    business_address: nullableText,
    sponsor_level: nullableText,
    logo_url: nullableText,
  },
} as const;

const meSchema = {
  type: 'object',
  required: ['profile', 'role_profile'],
  properties: { profile: profileSchema, role_profile: roleProfileSchema },
} as const;

const optionalText = { type: ['string', 'null'], maxLength: TEXT_MAX_LENGTH } as const;
const optionalUrl = {
  type: ['string', 'null'],
  format: 'uri',
  pattern: '^https?://',
  maxLength: URL_MAX_LENGTH,
  description: 'http(s) URL, e.g. the public URL of a file in the profile-images bucket',
} as const;

const fullName = { type: 'string', minLength: 1, maxLength: FULL_NAME_MAX_LENGTH, pattern: NOT_BLANK } as const;
const phoneNumber = { type: ['string', 'null'], pattern: PHONE_PATTERN, description: 'Phone number, or null to clear' } as const;

const updateMeBodySchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    full_name: fullName,
    phone_number: phoneNumber,
    role_profile: {
      type: 'object',
      additionalProperties: false,
      minProperties: 1,
      description:
        'Fields of your role profile. donor: donation_preference, avatar_url. beneficiary: residential_address, ' +
        'assistance_type, avatar_url. volunteer: residential_address, availability_status, preferred_area, avatar_url. ' +
        'sponsor: organisation_name, sponsorship_type, representative_name, business_address, logo_url.',
      properties: {
        donation_preference: optionalText,
        avatar_url: optionalUrl,
        residential_address: optionalText,
        assistance_type: optionalText,
        availability_status: optionalText,
        preferred_area: optionalText,
        organisation_name: { type: 'string', minLength: 1, maxLength: TEXT_MAX_LENGTH, pattern: NOT_BLANK },
        sponsorship_type: optionalText,
        representative_name: optionalText,
        business_address: optionalText,
        logo_url: optionalUrl,
      },
    },
  },
} as const;

const completeProfileBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['role'],
  properties: {
    role: { type: 'string', enum: [...SELF_SERVICE_ROLES], description: 'administrator cannot be chosen' },
    full_name: fullName,
    phone_number: phoneNumber,
    organisation_name: { type: 'string', minLength: 1, maxLength: TEXT_MAX_LENGTH, pattern: NOT_BLANK },
  },
} as const;

const settingsSchema = {
  type: 'object',
  required: [
    'user_id',
    'theme_preference',
    'notify_campaign_updates',
    'notify_request_updates',
    'notify_donation_updates',
    'created_at',
    'updated_at',
  ],
  properties: {
    user_id: { type: 'string', format: 'uuid' },
    theme_preference: { type: 'string', enum: [...THEME_PREFERENCES] },
    notify_campaign_updates: { type: 'boolean' },
    notify_request_updates: { type: 'boolean' },
    notify_donation_updates: { type: 'boolean' },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
} as const;

const updateSettingsBodySchema = {
  type: 'object',
  additionalProperties: false,
  minProperties: 1,
  properties: {
    theme_preference: { type: 'string', enum: [...THEME_PREFERENCES] },
    notify_campaign_updates: { type: 'boolean' },
    notify_request_updates: { type: 'boolean' },
    notify_donation_updates: { type: 'boolean' },
  },
} as const;

const security = bearerSecurity;
const tags = ['me'];

export const getMeSchema = {
  tags,
  summary: 'Get my profile',
  description: 'Your public.profiles row plus the row of your role profile table (null if it does not exist yet).',
  security,
  response: { 200: dataResponse(meSchema), ...errorResponses(404) },
} as const;

export const updateMeSchema = {
  tags,
  summary: 'Update my profile',
  description:
    'Partial update of full_name, phone_number and your role profile fields. role, account_status, email and ' +
    'ids cannot be changed (unknown fields are ignored). Role profile fields of another role return 400.',
  security,
  body: updateMeBodySchema,
  response: { 200: dataResponse(meSchema), ...errorResponses(404) },
} as const;

export const completeProfileSchema = {
  tags,
  summary: 'Complete my profile',
  description:
    'Creates the missing role profile row for your role (and optionally sets full_name/phone_number). ' +
    'Sign-up already stores your role in public.profiles and the database does not let you change it, so ' +
    'role must equal your current role (409 otherwise). 409 if the role profile already exists. ' +
    'administrator cannot be chosen. 501 if you have no profile row (the database has no INSERT policy on profiles).',
  security,
  body: completeProfileBodySchema,
  response: { 201: dataResponse(meSchema), ...errorResponses(409, 501) },
} as const;

export const getSettingsSchema = {
  tags,
  summary: 'Get my settings',
  description: 'Your user_settings row. If it is missing, the default row is created first (insert, on conflict do nothing).',
  security,
  response: { 200: dataResponse(settingsSchema), ...errorResponses() },
} as const;

export const updateSettingsSchema = {
  tags,
  summary: 'Save my settings',
  description:
    'Saves the given settings (at least one); omitted settings keep their current value. theme_preference is ' +
    'light, dark or system. updated_at is set by the database.',
  security,
  body: updateSettingsBodySchema,
  response: { 200: dataResponse(settingsSchema), ...errorResponses() },
} as const;
