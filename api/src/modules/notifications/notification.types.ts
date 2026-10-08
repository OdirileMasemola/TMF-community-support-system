/** Notification types. Field names are the public.notifications column names. */

/** Values of the public.notification_status enum. */
export const NOTIFICATION_STATUSES = ['unread', 'read'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

/** Columns returned by the notification endpoints (same list as web/mobile services/notifications.ts). */
export const NOTIFICATION_COLUMNS =
  'id, user_id, title, message, notification_type, status, link_url, related_entity_type, related_entity_id, notification_date';

export interface Notification {
  id: string;
  user_id: string;
  title: string | null;
  message: string;
  notification_type: string;
  status: NotificationStatus;
  link_url: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  notification_date: string;
}

export interface ListNotificationsQuery {
  status?: NotificationStatus;
  page?: number;
  pageSize?: number;
}

export interface NotificationIdParams {
  id: string;
}

export interface NotificationPage {
  items: Notification[];
  total: number;
  /** All of the caller's unread notifications (independent of the status filter and page). */
  unreadCount: number;
}
