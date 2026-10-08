import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { createMeController } from './me.controller.js';
import {
  completeProfileSchema,
  getMeSchema,
  getSettingsSchema,
  updateMeSchema,
  updateSettingsSchema,
} from './me.schema.js';
import { createMeService } from './me.service.js';
import type { CompleteProfileBody, UpdateMeBody, UpdateSettingsBody } from './me.types.js';

/**
 * The caller's own profile and settings, registered under /api/v1/me.
 * Route -> Controller -> Service -> user-scoped Supabase client (RLS applies).
 *
 * Any signed-in, non-suspended account (authenticate runs in preValidation, before body validation).
 * RLS: profiles "Users can read their own profile" / "Users can update their own profile";
 * role profiles "Users manage own <role> profile"; user_settings "Users view/create/update own settings".
 */
export async function meRoutes(app: FastifyInstance): Promise<void> {
  const controller = createMeController(createMeService({ createUserClient: app.createUserClient }));
  const signedIn = [authenticate];

  app.get('/', { preValidation: signedIn, schema: getMeSchema }, controller.get);
  app.patch<{ Body: UpdateMeBody }>('/', { preValidation: signedIn, schema: updateMeSchema }, controller.update);
  app.post<{ Body: CompleteProfileBody }>(
    '/profile',
    { preValidation: signedIn, schema: completeProfileSchema },
    controller.completeProfile,
  );
  app.get('/settings', { preValidation: signedIn, schema: getSettingsSchema }, controller.getSettings);
  app.put<{ Body: UpdateSettingsBody }>(
    '/settings',
    { preValidation: signedIn, schema: updateSettingsSchema },
    controller.updateSettings,
  );
}
