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
