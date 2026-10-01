import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import { loadConfig } from '../src/config/env.js';
import { authenticate } from '../src/middleware/authenticate.js';
import { requireRole } from '../src/middleware/authorize.js';
import { ApiError } from '../src/shared/errors/ApiError.js';
import type { AuthProvider, UserRole } from '../src/shared/types/auth.types.js';

// In-memory stand-in for Supabase Auth + public.profiles. No network calls are made.
interface FakeAccount {
  id: string;
  email: string;
  role: UserRole | null;
}

const ACCOUNTS: Record<string, FakeAccount> = {
  'admin-token-abc123': { id: '11111111-1111-4111-8111-111111111111', email: 'admin@example.org', role: 'administrator' },
  'donor-token-def456': { id: '22222222-2222-4222-8222-222222222222', email: 'donor@example.org', role: 'donor' },
  'norole-token-ghi789': { id: '33333333-3333-4333-8333-333333333333', email: 'new@example.org', role: null },
};
const UNAVAILABLE_TOKEN = 'auth-down-token-xyz';

const getUser = vi.fn<AuthProvider['getUser']>(async (token) => {
  if (token === UNAVAILABLE_TOKEN) {
    throw new ApiError(503, 'SERVICE_UNAVAILABLE', 'Authentication service is unavailable');
  }
  const account = ACCOUNTS[token];
  return account === undefined ? null : { id: account.id, email: account.email };
});

const getRole = vi.fn<AuthProvider['getRole']>(async (userId, token) => {
  const account = ACCOUNTS[token];
  return account !== undefined && account.id === userId ? account.role : null;
});

const fakeAuthProvider: AuthProvider = { getUser, getRole };

function expectErrorShape(response: LightMyRequestResponse, statusCode: number, code: string): void {
  expect(response.statusCode).toBe(statusCode);
  const body: unknown = response.json();
  expect(body).toEqual({ error: { code, message: expect.any(String) } });
}

describe('authentication and authorization', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp(loadConfig(), { authProvider: fakeAuthProvider });

    // Test-only routes (not part of src/).
    app.get('/test/authenticated', { preHandler: [authenticate] }, async (request) => ({ user: request.user }));
    app.post(
      '/test/admin-only',
      { preHandler: [authenticate, requireRole('administrator')] },
      async (request) => ({ ok: true, role: request.user?.role ?? null }),
    );
    app.get(
      '/test/donor-or-sponsor',
      { preHandler: [authenticate, requireRole('donor', 'sponsor')] },
      async () => ({ ok: true }),
    );
    app.get('/test/role-without-authenticate', { preHandler: [requireRole('administrator')] }, async () => ({
      ok: true,
    }));

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    getUser.mockClear();
    getRole.mockClear();
  });

  describe('authenticate', () => {
    it('rejects a request without an Authorization header with 401', async () => {
      const response = await app.inject({ method: 'GET', url: '/test/authenticated' });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(response.json()).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Missing access token' } });
      expect(getUser).not.toHaveBeenCalled();
    });

    it.each(['Basic dXNlcjpwYXNz', 'Bearer', 'Bearer   ', 'admin-token-abc123', 'Bearer a b', 'Token admin-token-abc123'])(
      'rejects malformed Authorization header %j with 401 without calling Supabase',
      async (authorization) => {
        const response = await app.inject({ method: 'GET', url: '/test/authenticated', headers: { authorization } });
        expectErrorShape(response, 401, 'UNAUTHORIZED');
        expect(getUser).not.toHaveBeenCalled();
      },
    );

    it('rejects an invalid or expired token with 401', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/authenticated',
        headers: { authorization: 'Bearer not-a-real-token' },
      });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(response.json()).toEqual({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired access token' } });
      expect(getUser).toHaveBeenCalledWith('not-a-real-token');
      expect(getRole).not.toHaveBeenCalled();
      expect(response.body).not.toContain('not-a-real-token');
    });

    it('returns 503 when the auth service is unavailable', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/authenticated',
        headers: { authorization: `Bearer ${UNAVAILABLE_TOKEN}` },
      });
      expectErrorShape(response, 503, 'SERVICE_UNAVAILABLE');
      expect(response.body).not.toContain(UNAVAILABLE_TOKEN);
    });

    it('attaches the verified user with the role from the profile', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/authenticated',
        headers: { authorization: 'Bearer donor-token-def456' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        user: { id: '22222222-2222-4222-8222-222222222222', email: 'donor@example.org', role: 'donor' },
      });
      expect(getRole).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222', 'donor-token-def456');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 for anonymous requests', async () => {
      const response = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
    });

    it('returns 401 for an invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: 'Bearer expired-token' },
      });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
      expect(response.body).not.toContain('expired-token');
    });

    it('returns id, email and role for a valid token, and never the token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: 'Bearer admin-token-abc123' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        data: { id: '11111111-1111-4111-8111-111111111111', email: 'admin@example.org', role: 'administrator' },
      });
      expect(response.body).not.toContain('admin-token-abc123');
      expect(response.headers['authorization']).toBeUndefined();
    });

    it('returns role null when the user has no profile role', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: 'Bearer norole-token-ghi789' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        data: { id: '33333333-3333-4333-8333-333333333333', email: 'new@example.org', role: null },
      });
    });

    it('ignores a role supplied by the client in headers or query', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me?role=administrator',
        headers: { authorization: 'Bearer donor-token-def456', 'x-user-role': 'administrator', 'x-user-id': 'someone-else' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        data: { id: '22222222-2222-4222-8222-222222222222', email: 'donor@example.org', role: 'donor' },
      });
    });
  });

  describe('requireRole', () => {
    it('allows a user with the required role', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/test/admin-only',
        headers: { authorization: 'Bearer admin-token-abc123' },
      });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ ok: true, role: 'administrator' });
    });

    it('allows any of several roles', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/donor-or-sponsor',
        headers: { authorization: 'Bearer donor-token-def456' },
      });
      expect(response.statusCode).toBe(200);
    });

    it('rejects a user with the wrong role with 403 without revealing the required roles', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/test/admin-only',
        headers: { authorization: 'Bearer donor-token-def456' },
      });
      expectErrorShape(response, 403, 'FORBIDDEN');
      expect(response.body).not.toContain('administrator');
    });

    it('rejects a user without a profile role with 403', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/donor-or-sponsor',
        headers: { authorization: 'Bearer norole-token-ghi789' },
      });
      expectErrorShape(response, 403, 'FORBIDDEN');
    });

    it('ignores a role supplied in the body or headers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/test/admin-only',
        headers: { authorization: 'Bearer donor-token-def456', 'x-user-role': 'administrator' },
        payload: { role: 'administrator', user: { role: 'administrator' } },
      });
      expectErrorShape(response, 403, 'FORBIDDEN');
    });

    it('rejects anonymous requests with 401', async () => {
      const response = await app.inject({ method: 'POST', url: '/test/admin-only' });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
    });

    it('returns 401 when used without authenticate', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/test/role-without-authenticate',
        headers: { authorization: 'Bearer admin-token-abc123', 'x-user-role': 'administrator' },
      });
      expectErrorShape(response, 401, 'UNAUTHORIZED');
    });
  });

  describe('OpenAPI docs', () => {
    it('documents the bearer scheme and /api/v1/auth/me', async () => {
      const response = await app.inject({ method: 'GET', url: '/docs/json' });
      expect(response.statusCode).toBe(200);
      const spec = response.json<{
        paths: Record<string, Record<string, { security?: unknown }>>;
        components: { securitySchemes: Record<string, unknown> };
      }>();
      expect(spec.components.securitySchemes['bearerAuth']).toMatchObject({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      });
      expect(spec.paths['/api/v1/auth/me']?.['get']?.security).toEqual([{ bearerAuth: [] }]);
      expect(spec.paths['/api/health']?.['get']?.security).toBeUndefined();
    });
  });
});
