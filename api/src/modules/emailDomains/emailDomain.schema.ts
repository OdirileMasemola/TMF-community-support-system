import { ERROR_RESPONSE_SCHEMA_REF } from '../../shared/utils/response.js';
import { bearerSecurity, dataResponse, errorResponses, idParamsSchema } from '../../shared/utils/schemas.js';
import { MAX_EMAIL_LENGTH } from './emailAddress.js';
import {
  DNS_STATUSES,
  DOMAIN_POLICY_TYPES,
  DOMAIN_STATUSES,
  NOTES_MAX_LENGTH,
  REGISTRATION_MODES,
} from './emailDomain.types.js';

/* JSON Schemas for the registration email check and the email domain administration routes. */

/** Generous upper bound before normalisation (an IDN is longer once converted to punycode). */
const RAW_DOMAIN_MAX_LENGTH = 253;
export const AUDIT_DEFAULT_LIMIT = 50;
export const AUDIT_MAX_LIMIT = 200;

const timestamp = { type: 'string', format: 'date-time' } as const;
const nullableUuid = { type: ['string', 'null'], format: 'uuid' } as const;

export const emailDomainSchema = {
  type: 'object',
  required: ['id', 'domain', 'policy_type', 'status', 'notes', 'dns_status', 'dns_checked_at', 'created_at', 'updated_at', 'created_by', 'updated_by'],
  properties: {
    id: { type: 'string', format: 'uuid' },
    domain: { type: 'string', description: 'Lower-case ASCII; IDNs are stored in punycode (xn--).' },
    policy_type: { type: 'string', enum: DOMAIN_POLICY_TYPES },
    status: { type: 'string', enum: DOMAIN_STATUSES },
    notes: { type: ['string', 'null'] },
    dns_status: { type: 'string', enum: DNS_STATUSES, description: 'Result of the last MX / A / AAAA check.' },
    dns_checked_at: { type: ['string', 'null'], format: 'date-time' },
    created_at: timestamp,
    updated_at: timestamp,
    created_by: nullableUuid,
    updated_by: nullableUuid,
  },
} as const;

const policySchema = {
  type: 'object',
  required: ['registration_mode', 'updated_at', 'updated_by'],
  properties: {
    registration_mode: { type: 'string', enum: REGISTRATION_MODES },
    updated_at: timestamp,
    updated_by: nullableUuid,
  },
} as const;

const auditSchema = {
  type: 'object',
  required: ['id', 'entity', 'action', 'domain', 'old_values', 'new_values', 'actor_id', 'created_at'],
  properties: {
    id: { type: 'integer' },
    entity: { type: 'string', enum: ['domain', 'policy'] },
    action: { type: 'string', enum: ['insert', 'update', 'delete'] },
    domain: { type: ['string', 'null'] },
    old_values: { type: ['object', 'null'], additionalProperties: true },
    new_values: { type: ['object', 'null'], additionalProperties: true },
    actor_id: nullableUuid,
    created_at: timestamp,
  },
} as const;

const notesProperty = { type: ['string', 'null'], maxLength: NOTES_MAX_LENGTH } as const;
const idParams = idParamsSchema('Email domain id');

export const emailCheckSchema = {
  tags: ['auth'],
  summary: 'Check an email address before registration',
  description:
    'Public. Runs the registration rules every client must pass before calling Supabase signUp: ' +
    'email format, DNS mail configuration (MX, or A/AAAA when there is no MX) and the domain policy ' +
    '(blocked domains; approved-only in restricted mode). Creates no account. On success returns the ' +
    'normalised address and, when configured, a short-lived attestation for the Supabase Auth hook. ' +
    'DNS shows that the domain can receive mail, not that the mailbox exists or belongs to the caller: ' +
    'Supabase email confirmation proves ownership. Rate limited per client.',
  body: {
    type: 'object',
    required: ['email'],
    additionalProperties: false,
    properties: { email: { type: 'string', maxLength: MAX_EMAIL_LENGTH * 4 } },
  },
  response: {
    200: dataResponse({
      type: 'object',
      required: ['email', 'domain', 'attestation', 'attestationExpiresAt'],
      properties: {
        email: { type: 'string' },
        domain: { type: 'string' },
        attestation: { type: ['string', 'null'] },
        attestationExpiresAt: { type: ['string', 'null'], format: 'date-time' },
      },
    }),
    400: ERROR_RESPONSE_SCHEMA_REF,
    422: ERROR_RESPONSE_SCHEMA_REF,
    429: ERROR_RESPONSE_SCHEMA_REF,
    500: ERROR_RESPONSE_SCHEMA_REF,
    503: ERROR_RESPONSE_SCHEMA_REF,
  },
} as const;

export const verificationStatusSchema = {
  tags: ['auth'],
  summary: 'Email verification status of the caller',
  description:
    "Whether the caller's email address is confirmed, read from Supabase Auth (email_confirmed_at). " +
    'Never from user_metadata or anything the client sends.',
  security: bearerSecurity,
  response: {
    200: dataResponse({
      type: 'object',
      required: ['email', 'emailVerified', 'emailConfirmedAt'],
      properties: {
        email: { type: ['string', 'null'] },
        emailVerified: { type: 'boolean' },
        emailConfirmedAt: { type: ['string', 'null'] },
      },
    }),
    ...errorResponses(),
  },
} as const;

const adminTags = ['admin', 'email-domains'];

export const listDomainsSchema = {
  tags: adminTags,
  summary: 'List managed email domains',
  security: bearerSecurity,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      policy_type: { type: 'string', enum: DOMAIN_POLICY_TYPES },
      status: { type: 'string', enum: DOMAIN_STATUSES },
      search: { type: 'string', maxLength: RAW_DOMAIN_MAX_LENGTH, pattern: '^[A-Za-z0-9.-]*$' },
    },
  },
  response: { 200: dataResponse({ type: 'array', items: emailDomainSchema }), ...errorResponses() },
} as const;

export const createDomainSchema = {
  tags: adminTags,
  summary: 'Add a managed email domain',
  description: 'The domain is normalised (lower-case, IDN to punycode) and its mail DNS is checked and recorded.',
  security: bearerSecurity,
  body: {
    type: 'object',
    required: ['domain', 'policy_type'],
    additionalProperties: false,
    properties: {
      domain: { type: 'string', minLength: 1, maxLength: RAW_DOMAIN_MAX_LENGTH },
      policy_type: { type: 'string', enum: DOMAIN_POLICY_TYPES },
      status: { type: 'string', enum: DOMAIN_STATUSES },
      notes: notesProperty,
    },
  },
  response: { 201: dataResponse(emailDomainSchema), ...errorResponses(409) },
} as const;

export const updateDomainSchema = {
  tags: adminTags,
  summary: 'Change a managed email domain',
  description: 'Approve / block, activate / deactivate or change the notes. The domain name itself cannot change.',
  security: bearerSecurity,
  params: idParams,
  body: {
    type: 'object',
    additionalProperties: false,
    minProperties: 1,
    properties: {
      policy_type: { type: 'string', enum: DOMAIN_POLICY_TYPES },
      status: { type: 'string', enum: DOMAIN_STATUSES },
      notes: notesProperty,
    },
  },
  response: { 200: dataResponse(emailDomainSchema), ...errorResponses(404) },
} as const;

export const recheckDomainSchema = {
  tags: adminTags,
  summary: 'Re-run the DNS check for a managed domain',
  security: bearerSecurity,
  params: idParams,
  response: { 200: dataResponse(emailDomainSchema), ...errorResponses(404) },
} as const;

export const deleteDomainSchema = {
  tags: adminTags,
  summary: 'Remove a managed email domain',
  security: bearerSecurity,
  params: idParams,
  response: {
    200: dataResponse({ type: 'object', required: ['id', 'deleted'], properties: { id: { type: 'string' }, deleted: { type: 'boolean' } } }),
    ...errorResponses(404),
  },
} as const;

export const getPolicySchema = {
  tags: adminTags,
  summary: 'Registration mode (open or restricted)',
  security: bearerSecurity,
  response: { 200: dataResponse(policySchema), ...errorResponses(404) },
} as const;

export const updatePolicySchema = {
  tags: adminTags,
  summary: 'Set the registration mode',
  description: 'open: any domain with valid mail DNS except blocked ones. restricted: only active approved domains. Existing accounts are not affected.',
  security: bearerSecurity,
  body: {
    type: 'object',
    required: ['registration_mode'],
    additionalProperties: false,
    properties: { registration_mode: { type: 'string', enum: REGISTRATION_MODES } },
  },
  response: { 200: dataResponse(policySchema), ...errorResponses(404) },
} as const;

export const listAuditSchema = {
  tags: adminTags,
  summary: 'Recent email domain and policy changes',
  security: bearerSecurity,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: { limit: { type: 'integer', minimum: 1, maximum: AUDIT_MAX_LIMIT, default: AUDIT_DEFAULT_LIMIT } },
  },
  response: { 200: dataResponse({ type: 'array', items: auditSchema }), ...errorResponses() },
} as const;
