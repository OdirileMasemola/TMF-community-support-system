import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { createNotificationController } from './notification.controller.js';
import {
  listNotificationsSchema,
  markAllNotificationsReadSchema,
  markNotificationReadSchema,
} from './notification.schema.js';
import { createNotificationService } from './notification.service.js';
import type { ListNotificationsQuery, NotificationIdParams } from './notification.types.js';

/**
 * The caller's notifications, registered under /api/v1/notifications.
 * Route -> Controller -> Service -> user-scoped Supabase client (RLS applies).
 *
 * Any signed-in, non-suspended account. RLS: "Users view own notifications" (SELECT) and
 * "Users update own notifications" (UPDATE, user_id = auth.uid()). Notifications are created by the
 * database triggers (status changes, contact messages), not by this API.
 */
export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  const controller = createNotificationController(createNotificationService({ createUserClient: app.createUserClient }));
  const signedIn = [authenticate];

  app.get<{ Querystring: ListNotificationsQuery }>(
    '/',
    { preValidation: signedIn, schema: listNotificationsSchema },
    controller.list,
  );
  app.patch<{ Params: NotificationIdParams }>(
    '/:id/read',
    { preValidation: signedIn, schema: markNotificationReadSchema },
    controller.markRead,
  );
  app.post('/read-all', { preValidation: signedIn, schema: markAllNotificationsReadSchema }, controller.markAllRead);
}
