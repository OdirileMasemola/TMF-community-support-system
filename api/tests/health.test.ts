import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';

// Test env values (dummy Supabase URL/key) come from vitest.config.ts; no network calls are made.
describe('health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp(loadConfig());
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('builds and is ready', () => {
    expect(app.hasRoute({ method: 'GET', url: '/api/health' })).toBe(true);
  });

  it('GET /api/health returns 200', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
  });

  it('GET /api/health returns status ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    const body = response.json<{ status: string; service: string; timestamp: string }>();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('TMF Community Support API');
  });

  it('unknown routes return 404 with the standard error shape', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/does-not-exist' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /api/does-not-exist not found' },
    });
  });
});
