import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config/env.js';
import { APP_NAME, DOCS_PREFIX } from '../config/constants.js';

/**
 * OpenAPI spec generated from route schemas, served with Swagger UI at /docs
 * (raw spec at /docs/json). Must be registered before routes so they are captured.
 */
export async function registerSwagger(app: FastifyInstance, config: AppConfig): Promise<void> {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: APP_NAME,
        description: 'REST API for the Themba Molefe Foundation Community Support System.',
        version: config.apiVersion,
      },
      tags: [
        { name: 'health', description: 'Service health' },
        { name: 'auth', description: 'Authentication (Supabase access tokens)' },
        { name: 'campaigns', description: 'Campaigns (reads: signed-in users, writes: administrators)' },
        { name: 'me', description: 'My profile, role profile and settings' },
        { name: 'notifications', description: 'My notifications' },
        { name: 'donations', description: 'Donations and proofs of payment (donors; review: administrators)' },
        { name: 'assistance', description: 'Assistance requests, supporting documents and collection schedules (beneficiaries; review: administrators)' },
        { name: 'volunteers', description: 'Volunteer opportunities, applications, assignments and hours (volunteers; review: administrators)' },
        { name: 'sponsorships', description: 'Sponsorships and sponsorship requests (sponsors; lists: administrators)' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Supabase access token: Authorization: Bearer <access_token>',
          },
        },
      },
    },
    // Name shared schemas (e.g. ErrorResponse) by their $id in components.schemas.
    refResolver: {
      buildLocalReference: (json, _baseUri, _fragment, i) =>
        typeof json.$id === 'string' ? json.$id : `def-${i}`,
    },
  });

  await app.register(swaggerUi, {
    routePrefix: DOCS_PREFIX,
  });
}
