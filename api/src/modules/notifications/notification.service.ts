import type { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../../shared/errors/ApiError.js';
import { toApiError } from '../../shared/supabase/errors.js';
import { runCountQuery, runPagedQuery } from '../../shared/supabase/query.js';
import type { UserId } from '../../shared/types/auth.types.js';
import { toRange, type PaginationParams } from '../../shared/utils/pagination.js';
import {
  NOTIFICATION_COLUMNS,
  type Notification,
  type NotificationPage,
  type NotificationStatus,
} from './notification.types.js';

export interface NotificationServiceDeps {
  /** Creates a client that acts as the caller (their token is sent, so RLS applies). Never service-role. */
  createUserClient: (accessToken: string) => SupabaseClient;
}

export interface NotificationService {
  list(accessToken: string, userId: UserId, status: NotificationStatus | undefined, pagination: PaginationParams): Promise<NotificationPage>;
  markRead(accessToken: string, userId: UserId, id: string): Promise<Notification>;
  markAllRead(accessToken: string, userId: UserId): Promise<number>;
}

const RESOURCE = 'notification';

/**
 * The caller's notifications. RLS ("Users view own notifications") also lets administrators read
 * everyone's notifications, so every query is filtered to user_id = the caller.
 */
export function createNotificationService(deps: NotificationServiceDeps): NotificationService {
  return {
    async list(accessToken, userId, status, pagination) {
      const client = deps.createUserClient(accessToken);
      const { from, to } = toRange(pagination);
      const filtered = (head: boolean) => {
        let query = client
          .from('notifications')
          .select(head ? 'id' : NOTIFICATION_COLUMNS, { count: 'exact', head })
          .eq('user_id', userId);
        if (status !== undefined) query = query.eq('status', status);
        return query;
      };
      const toError = (error: Parameters<typeof toApiError>[0], code: number) => toApiError(error, code, 'list', RESOURCE);
      const page = await runPagedQuery<Notification>(
        filtered(false)
          .order('notification_date', { ascending: false })
          .order('id', { ascending: false })
          .range(from, to)
          .overrideTypes<Notification[], { merge: false }>()
          .retry(false),
        () => filtered(true).retry(false),
        toError,
      );
      const unreadCount =
        status === 'unread'
          ? page.total
          : await runCountQuery(
              client
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('status', 'unread')
                .retry(false),
              toError,
            );
      return { ...page, unreadCount };
    },

    async markRead(accessToken, userId, id) {
      const client = deps.createUserClient(accessToken);
      // "Users update own notifications": USING/WITH CHECK user_id = auth.uid(). Only status is sent.
      const { data, error, status } = await client
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', id)
        .eq('user_id', userId)
        .select(NOTIFICATION_COLUMNS)
        .overrideTypes<Notification[], { merge: false }>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'update', RESOURCE);
      const updated = data[0];
      // Same 404 for a missing notification and someone else's.
      if (updated === undefined) throw ApiError.notFound('Notification not found');
      return updated;
    },

    async markAllRead(accessToken, userId) {
      const client = deps.createUserClient(accessToken);
      const { data, error, status } = await client
        .from('notifications')
        .update({ status: 'read' })
        .eq('user_id', userId)
        .eq('status', 'unread')
        .select('id')
        .overrideTypes<Array<{ id: string }>, { merge: false }>()
        .retry(false);
      if (error !== null) throw toApiError(error, status, 'update', RESOURCE);
      return data.length;
    },
  };
}
