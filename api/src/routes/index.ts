import type { FastifyInstance } from 'fastify';
import { API_PREFIX, API_V1_PREFIX } from '../config/constants.js';
import { adminRoutes } from '../modules/admin/admin.routes.js';
import { assistanceRoutes } from '../modules/assistance/assistance.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { campaignRoutes } from '../modules/campaigns/campaign.routes.js';
import { donationRoutes } from '../modules/donations/donation.routes.js';
import { eventRoutes } from '../modules/events/event.routes.js';
import { reportRoutes } from '../modules/reports/report.routes.js';
import { healthRoutes } from '../modules/health/health.routes.js';
import { meRoutes } from '../modules/me/me.routes.js';
import { notificationRoutes } from '../modules/notifications/notification.routes.js';
import { sponsorshipRoutes } from '../modules/sponsorships/sponsorship.routes.js';
import { volunteerRoutes } from '../modules/volunteers/volunteer.routes.js';

/**
 * Versioned v1 routes (/api/v1/...). Add modules here, e.g.
 * `await app.register(someModuleRoutes, { prefix: '/some-module' });`
 */
async function v1Routes(app: FastifyInstance): Promise<void> {
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(campaignRoutes, { prefix: '/campaigns' });
  await app.register(meRoutes, { prefix: '/me' });
  await app.register(notificationRoutes, { prefix: '/notifications' });
  // Spans /donations and /admin/donation-proofs, so it is registered at the v1 root.
  await app.register(donationRoutes);
  // Spans /assistance-requests, /collection-schedules and /admin/..., so it is registered at the v1 root.
  await app.register(assistanceRoutes);
  // Spans /volunteer, /campaign-applications, /volunteer-assignments, /volunteer-hours and /admin/...
  await app.register(volunteerRoutes);
  // Spans /sponsorships and /sponsorship-requests.
  await app.register(sponsorshipRoutes);
  await app.register(eventRoutes, { prefix: '/events' });
  await app.register(reportRoutes, { prefix: '/reports' });
  await app.register(adminRoutes, { prefix: '/admin' });
}

/** Registers all route modules. */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Unversioned operational routes.
  await app.register(healthRoutes, { prefix: API_PREFIX });

  // Versioned business routes.
  await app.register(v1Routes, { prefix: API_V1_PREFIX });
}
