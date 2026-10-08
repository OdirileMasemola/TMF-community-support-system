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
  DONATION_KINDS,
  PAYMENT_STATUSES,
  PROOF_DECISIONS,
  SIGNED_URL_TTL_SECONDS,
  VERIFICATION_STATUSES,
} from './donation.types.js';

/*
 * JSON Schemas for the donation routes (request validation + Swagger). Request bodies use
 * additionalProperties: false, so Fastify strips fields the client may not set (status,
 * receipt_number, donor_id, verification_status, reviewed_by, ...). The maxLength values are API
 * limits; the text columns have none.
 */

export const TEXT_MAX_LENGTH = 300;
export const NOTES_MAX_LENGTH = 1000;
/** numeric(12,2) */
export const AMOUNT_MAX = 9_999_999_999.99;

const nullableText = { type: ['string', 'null'] } as const;
const optionalText = { type: ['string', 'null'], maxLength: TEXT_MAX_LENGTH } as const;
const campaignRef = {
  type: ['object', 'null'],
  required: ['id', 'title'],
  properties: { id: { type: 'string', format: 'uuid' }, title: { type: 'string' } },
} as const;

const donationProperties = {
  id: { type: 'string', format: 'uuid' },
  donor_id: { type: 'string', format: 'uuid', description: 'donor_profiles.id (not the auth user id)' },
  campaign_id: { type: ['string', 'null'], format: 'uuid' },
  amount: { type: ['number', 'null'] },
  donation_date: { type: 'string', format: 'date-time' },
  payment_method: { type: 'string' },
  status: { type: 'string', enum: [...PAYMENT_STATUSES] },
  receipt_number: nullableText,
  donation_kind: { type: 'string', enum: [...DONATION_KINDS] },
  item_description: nullableText,
  item_quantity: { type: ['integer', 'null'] },
  payment_reference: nullableText,
  notes: nullableText,
} as const;

const donationSchema = {
  type: 'object',
  required: Object.keys(donationProperties),
  properties: donationProperties,
} as const;

const myDonationSchema = {
  type: 'object',
  required: [...Object.keys(donationProperties), 'campaigns', 'donation_proofs'],
  properties: {
    ...donationProperties,
    campaigns: { ...campaignRef, description: 'The campaign, or null (general fund, or a campaign that is no longer active)' },
    donation_proofs: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          verification_status: { type: 'string', enum: [...VERIFICATION_STATUSES] },
          uploaded_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
} as const;

const proofProperties = {
  id: { type: 'string', format: 'uuid' },
  donation_id: { type: 'string', format: 'uuid' },
  file_path: { type: 'string' },
  file_name: nullableText,
  payment_reference: nullableText,
  payment_date: { type: ['string', 'null'], format: 'date' },
  admin_comment: nullableText,
  verification_status: { type: 'string', enum: [...VERIFICATION_STATUSES] },
  reviewed_by: { type: ['string', 'null'], format: 'uuid', description: 'administrator_profiles.id' },
  reviewed_at: { type: ['string', 'null'], format: 'date-time' },
  uploaded_at: { type: 'string', format: 'date-time' },
} as const;

const proofSchema = {
  type: 'object',
  required: Object.keys(proofProperties),
  properties: proofProperties,
} as const;

const reviewProofItemSchema = {
  type: 'object',
  required: [...Object.keys(proofProperties), 'donations', 'signed_url'],
  properties: {
    ...proofProperties,
    donations: {
      type: ['object', 'null'],
      properties: {
        id: donationProperties.id,
        donor_id: donationProperties.donor_id,
        campaign_id: donationProperties.campaign_id,
        amount: donationProperties.amount,
        donation_kind: donationProperties.donation_kind,
        payment_reference: donationProperties.payment_reference,
        donation_date: donationProperties.donation_date,
        status: donationProperties.status,
        campaigns: campaignRef,
      },
    },
    signed_url: {
      type: ['string', 'null'],
      description: `Signed URL of the file in the donation-proofs bucket, valid for ${SIGNED_URL_TTL_SECONDS} seconds; null if it could not be signed`,
    },
  },
} as const;

const createDonationBodySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    donation_kind: { type: 'string', enum: [...DONATION_KINDS], default: 'money' },
    campaign_id: { type: ['string', 'null'], format: 'uuid', description: 'An active campaign; omit or null for the general fund' },
    amount: {
      type: ['number', 'null'],
      exclusiveMinimum: 0,
      maximum: AMOUNT_MAX,
      description: 'Rand, at most two decimals. Required for money, must be omitted for in_kind.',
    },
    payment_method: { type: 'string', minLength: 1, maxLength: 50, pattern: NOT_BLANK, default: 'EFT' },
    payment_reference: { type: ['string', 'null'], maxLength: 100 },
    item_description: { ...optionalText, description: 'Required for in_kind' },
    item_quantity: { type: ['integer', 'null'], minimum: 1, maximum: 1_000_000, description: 'Required for in_kind' },
    notes: { type: ['string', 'null'], maxLength: NOTES_MAX_LENGTH },
  },
} as const;

const createProofBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['file_path'],
  properties: {
    file_path: {
      type: 'string',
      maxLength: FILE_PATH_MAX_LENGTH,
      pattern: OWN_FILE_PATH_PATTERN,
      description: 'Path of the uploaded file in the donation-proofs bucket; must start with your auth user id',
    },
    file_name: optionalText,
    payment_reference: { type: ['string', 'null'], maxLength: 100 },
    payment_date: { type: ['string', 'null'], format: 'date', description: 'Not in the future' },
  },
} as const;

const reviewProofBodySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['verification_status'],
  properties: {
    verification_status: { type: 'string', enum: [...PROOF_DECISIONS] },
    admin_comment: { type: ['string', 'null'], maxLength: NOTES_MAX_LENGTH },
  },
} as const;

const security = bearerSecurity;
const tags = ['donations'];

export const createDonationSchema = {
  tags,
  summary: 'Record a donation (donors)',
  description:
    'Creates a pending donation for your donor profile. status is always pending and receipt_number is never ' +
    'set; any status, receipt_number or donor_id in the body is ignored. Then upload the proof of payment to ' +
    'the donation-proofs bucket and call POST /donations/{id}/proofs.',
  security,
  body: createDonationBodySchema,
  response: { 201: dataResponse(donationSchema), ...errorResponses(404) },
} as const;

export const listMyDonationsSchema = {
  tags,
  summary: 'List my donations (donors)',
  description: 'Your donations, newest first, with their campaign and proofs.',
  security,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: { status: { type: 'string', enum: [...PAYMENT_STATUSES] }, ...paginationQueryProperties },
  },
  response: { 200: listResponse(myDonationSchema), ...errorResponses() },
} as const;

export const createProofSchema = {
  tags,
  summary: 'Submit a proof of payment for my donation (donors)',
  description:
    'Only for your own donations that are pending or failed (a previous proof was rejected). The file must ' +
    'already be uploaded to your folder in the donation-proofs bucket. The proof starts as pending.',
  security,
  params: idParamsSchema('Donation id'),
  body: createProofBodySchema,
  response: { 201: dataResponse(proofSchema), ...errorResponses(404, 409) },
} as const;

export const listProofsSchema = {
  tags,
  summary: 'List donation proofs (administrators)',
  description: 'Newest first, optionally filtered by verification status, with the donation and a signed file URL.',
  security,
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: { status: { type: 'string', enum: [...VERIFICATION_STATUSES] }, ...paginationQueryProperties },
  },
  response: { 200: listResponse(reviewProofItemSchema), ...errorResponses() },
} as const;

export const reviewProofSchema = {
  tags,
  summary: 'Approve or reject a donation proof (administrators)',
  description:
    'Only pending proofs can be reviewed (409 otherwise). Approving marks the donation successful (if it is ' +
    'pending or failed); rejecting marks a pending donation failed. The donor is notified by the database.',
  security,
  params: idParamsSchema('Donation proof id'),
  body: reviewProofBodySchema,
  response: { 200: dataResponse(reviewProofItemSchema), ...errorResponses(404, 409) },
} as const;
