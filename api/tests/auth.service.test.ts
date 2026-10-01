import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { createSupabaseAuthProvider } from '../src/modules/auth/auth.service.js';
import { ApiError } from '../src/shared/errors/ApiError.js';

// Exercises the real supabase-js client against a fake fetch (no network), to check how
// Supabase responses are mapped. Production code is unchanged; only the test client differs.
const SUPABASE_URL = 'https://example.supabase.co';
const USER_ID = '44444444-4444-4444-8444-444444444444';

type FakeFetch = (url: string, init: RequestInit | undefined) => Promise<Response>;

interface RecordedRequest {
  url: string;
  authorization: string | null;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function providerWithFetch(handler: FakeFetch) {
  const requests: RecordedRequest[] = [];
  const fakeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = input instanceof Request ? input.url : input.toString();
    requests.push({ url, authorization: new Headers(init?.headers).get('authorization') });
    return handler(url, init);
  };
  const makeClient = (accessToken?: string): SupabaseClient =>
    createClient(SUPABASE_URL, 'test-publishable-key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: fakeFetch,
        ...(accessToken === undefined ? {} : { headers: { Authorization: `Bearer ${accessToken}` } }),
      },
    });
  const provider = createSupabaseAuthProvider({ supabase: makeClient(), createUserClient: makeClient });
  return { provider, requests };
}

async function expectApiError(promise: Promise<unknown>, statusCode: number, code: string): Promise<void> {
  const error: unknown = await promise.then(
    () => undefined,
    (rejection: unknown) => rejection,
  );
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({ statusCode, code });
}

describe('Supabase auth provider', () => {
  describe('getUser', () => {
    it('verifies the token with the Supabase Auth server and returns id and email', async () => {
      const { provider, requests } = providerWithFetch(async () =>
        jsonResponse(200, { id: USER_ID, aud: 'authenticated', email: 'user@example.org', app_metadata: {}, user_metadata: { role: 'administrator' }, created_at: '2026-01-01T00:00:00Z' }),
      );
      await expect(provider.getUser('valid-token')).resolves.toEqual({ id: USER_ID, email: 'user@example.org' });
      expect(requests[0]?.url).toBe(`${SUPABASE_URL}/auth/v1/user`);
      expect(requests[0]?.authorization).toBe('Bearer valid-token');
    });

    it('returns null for a token rejected by Supabase Auth (403 bad_jwt)', async () => {
      const { provider } = providerWithFetch(async () =>
        jsonResponse(403, { code: 'bad_jwt', msg: 'invalid JWT: unable to parse or verify signature' }),
      );
      await expect(provider.getUser('bad-token')).resolves.toBeNull();
    });

    it('returns null for an unauthorized token (401)', async () => {
      const { provider } = providerWithFetch(async () => jsonResponse(401, { msg: 'token is expired' }));
      await expect(provider.getUser('expired-token')).resolves.toBeNull();
    });

    it('throws a 503 ApiError when Supabase Auth is unreachable', async () => {
      const { provider } = providerWithFetch(async () => {
        throw new TypeError('fetch failed');
      });
      await expectApiError(provider.getUser('any-token'), 503, 'SERVICE_UNAVAILABLE');
    });

    it('throws a 503 ApiError when Supabase Auth returns a 5xx error', async () => {
      const { provider } = providerWithFetch(async () => jsonResponse(502, { msg: 'bad gateway' }));
      await expectApiError(provider.getUser('any-token'), 503, 'SERVICE_UNAVAILABLE');
    });
  });

  describe('getProfile', () => {
    it('reads role and account_status in one query as the user (their token is sent, so RLS applies)', async () => {
      const { provider, requests } = providerWithFetch(async () =>
        jsonResponse(200, [{ role: 'volunteer', account_status: 'pending' }]),
      );
      await expect(provider.getProfile(USER_ID, 'user-token')).resolves.toEqual({
        role: 'volunteer',
        accountStatus: 'pending',
      });
      expect(requests).toHaveLength(1);
      const url = new URL(requests[0]?.url ?? '');
      expect(url.pathname).toBe('/rest/v1/profiles');
      expect(url.searchParams.get('select')).toBe('role,account_status');
      expect(url.searchParams.get('id')).toBe(`eq.${USER_ID}`);
      expect(requests[0]?.authorization).toBe('Bearer user-token');
    });

    it('returns null when there is no profile row', async () => {
      const { provider } = providerWithFetch(async () => jsonResponse(200, []));
      await expect(provider.getProfile(USER_ID, 'user-token')).resolves.toBeNull();
    });

    it('maps unknown role and status values to null', async () => {
      const { provider } = providerWithFetch(async () =>
        jsonResponse(200, [{ role: 'superuser', account_status: 'banned' }]),
      );
      await expect(provider.getProfile(USER_ID, 'user-token')).resolves.toEqual({ role: null, accountStatus: null });
    });

    it('returns a suspended status as stored (authenticate decides)', async () => {
      const { provider } = providerWithFetch(async () =>
        jsonResponse(200, [{ role: 'administrator', account_status: 'suspended' }]),
      );
      await expect(provider.getProfile(USER_ID, 'user-token')).resolves.toEqual({
        role: 'administrator',
        accountStatus: 'suspended',
      });
    });

    it('throws a 503 ApiError when the database is unreachable', async () => {
      const { provider } = providerWithFetch(async () => {
        throw new TypeError('fetch failed');
      });
      await expectApiError(provider.getProfile(USER_ID, 'user-token'), 503, 'SERVICE_UNAVAILABLE');
    });

    it('throws a generic 500 ApiError for a database error without exposing details', async () => {
      const { provider } = providerWithFetch(async () =>
        jsonResponse(400, { code: '42703', message: 'column profiles.role does not exist', details: null, hint: null }),
      );
      const error: unknown = await provider.getProfile(USER_ID, 'user-token').catch((rejection: unknown) => rejection);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ statusCode: 500, code: 'INTERNAL_ERROR', message: 'Unable to load user profile' });
    });
  });
});
