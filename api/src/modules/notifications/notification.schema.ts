import {
  bearerSecurity,
  dataResponse,
  errorResponses,
  idParamsSchema,
  paginationMetaProperties,
  paginationQueryProperties,
} from '../../shared/utils/schemas.js';
import { NOTIFICATION_STATUSES } from './notification.types.js';

/* JSON Schemas for the notification routes (request validation + Swagger). */

const notificationSchema = {
  type: 'object',
  required: [
    'id',
    'user_id',
    'title',
    'message',
    'notification_type',
    'status',
    'link_url',
    'related_entity_type',
    'related_entity_id',
    'notification_date',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    user_id: { type: 'string', format: 'uuid' },
    title: { type: ['string', 'null'] },
    message: { type: 'string' },
    notification_type: { type: 'string' },
    status: { type: 'string', enum: [...NOTIFICATION_STATUSES] },
    link_url: { type: ['string', 'null'] },
    related_entity_type: { type: ['string', 'null'] },
    related_entity_id: { type: ['string', 'null'], format: 'uuid' },
    notification_date: { type: 'string', format: 'date-time' },
  },
} as const;

const listQuerySchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: [...NOTIFICATION_STATUSES] },
    ...paginationQueryProperties,
  },
} as const;

const listResponseSchema = {
  type: 'object',
  required: ['data', 'meta'],
  properties: {
    data: { type: 'array', items: notificationSchema },
    meta: {
      type: 'object',
      required: ['page', 'pageSize', 'total', 'totalPages', 'unreadCount'],
      properties: {
        ...paginationMetaProperties,
        unreadCount: { type: 'integer', description: 'All of your unread notifications' },
      },
    },
  },
} as const;

const security = bearerSecurity;
const tags = ['notifications'];

export const listNotificationsSchema = {
  tags,
  summary: 'List my notifications',
  description:
    'Your notifications, newest first, optionally filtered by status. meta.unreadCount is the number of all your ' +
    'unread notifications. Administrators also only get their own.',
  security,
  querystring: listQuerySchema,
  response: { 200: listResponseSchema, ...errorResponses() },
} as const;

export const markNotificationReadSchema = {
  tags,
  summary: 'Mark a notification as read',
  description: 'Returns 404 both when the notification does not exist and when it belongs to someone else.',
  security,
  params: idParamsSchema('Notification id'),
  response: { 200: dataResponse(notificationSchema), ...errorResponses(404) },
} as const;

export const markAllNotificationsReadSchema = {
  tags,
  summary: 'Mark all my notifications as read',
  security,
  response: {
    200: dataResponse({
      type: 'object',
      required: ['updated'],
      properties: { updated: { type: 'integer', description: 'Number of notifications changed from unread to read' } },
    }),
    ...errorResponses(),
  },
} as const;
