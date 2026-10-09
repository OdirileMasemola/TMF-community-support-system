import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { createEventController } from './event.controller.js';
import { createEventSchema, listEventsSchema, updateEventSchema } from './event.schema.js';
import { createEventService } from './event.service.js';
import type { CreateEventBody, EventIdParams, ListEventsQuery, UpdateEventBody } from './event.types.js';

/**
 * Event routes, registered under /api/v1/events.
 * Reads: signed-in users (RLS hides non-scheduled events from non-administrators).
 * Writes: administrators. admin_id comes from the caller's administrator profile.
 */
export async function eventRoutes(app: FastifyInstance): Promise<void> {
  const controller = createEventController(createEventService({ createUserClient: app.createUserClient }));
  const signedIn = [authenticate];
  const adminOnly = [authenticate, requireRole('administrator')];

  app.get<{ Querystring: ListEventsQuery }>('/', { preValidation: signedIn, schema: listEventsSchema }, controller.list);
  app.post<{ Body: CreateEventBody }>('/', { preValidation: adminOnly, schema: createEventSchema }, controller.create);
  app.patch<{ Params: EventIdParams; Body: UpdateEventBody }>(
    '/:id',
    { preValidation: adminOnly, schema: updateEventSchema },
    controller.update,
  );
}
