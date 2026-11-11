import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/shared/errors/ApiError.js';
import { createSupabaseEmailDomainStore } from '../src/modules/emailDomains/emailDomain.store.js';

// The real store against a recording fetch: which endpoint, which key and which token are used.
const URL_BASE = 'https://example.supabase.co';
const KEY = 'test-publishable-key';

function setup(respond: (url: URL, init: RequestInit) => { status: number; body: unknown }) {
  const requests: Array<{ url: URL; method: string; authorization: string | null; apikey: string | null; body: unknown }> = [];
  const fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    const headers = new Headers(init.headers);
    requests.push({
      url,
      method: (init.method ?? 'GET').toUpperCase(),
      authorization: headers.get('authorization'),
      apikey: headers.get('apikey'),
      body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
    });
    const { status, body } = respond(url, init);
    return new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
  };
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const store = createSupabaseEmailDomainStore({
    supabase: createClient(URL_BASE, KEY, { ...options, global: { fetch } }),
    createUserClient: (token) => createClient(URL_BASE, KEY, { ...options, global: { fetch, headers: { Authorization: `Bearer ${token}` } } }),
  });
  return { store, requests };
}

describe('Supabase email domain store', () => {
  it('asks the database for the policy decision with the publishable key only', async () => {
    const { store, requests } = setup(() => ({ status: 200, body: 'blocked' }));
    await expect(store.checkRegistration('blocked.example')).resolves.toBe('blocked');
    expect(requests[0]?.url.pathname).toBe('/rest/v1/rpc/email_domain_registration_check');
    expect(requests[0]?.method).toBe('POST');
    expect(requests[0]?.body).toEqual({ p_domain: 'blocked.example' });
    expect(requests[0]?.apikey).toBe(KEY);
    expect(requests[0]?.authorization).toBe(`Bearer ${KEY}`);
  });

  it('treats a null decision as allowed', async () => {
    const { store } = setup(() => ({ status: 200, body: null }));
    await expect(store.checkRegistration('gmail.com')).resolves.toBeNull();
  });

  it('fails closed (503) when the decision cannot be read or is unexpected', async () => {
    for (const response of [{ status: 500, body: { code: 'XX000', message: 'boom' } }, { status: 200, body: 'maybe' }]) {
      const { store } = setup(() => response);
      const error = await store.checkRegistration('gmail.com').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ statusCode: 503, code: 'SERVICE_UNAVAILABLE' });
    }
  });

  it('runs admin operations as the calling user so RLS applies', async () => {
    const { store, requests } = setup(() => ({ status: 200, body: [] }));
    await store.listDomains('admin-token', { policyType: 'blocked', search: 'exa' });
    expect(requests[0]?.authorization).toBe('Bearer admin-token');
    expect(requests[0]?.url.pathname).toBe('/rest/v1/email_domain_settings');
    expect(requests[0]?.url.searchParams.get('policy_type')).toBe('eq.blocked');
    expect(requests[0]?.url.searchParams.get('domain')).toBe('ilike.%exa%');
  });

  it('maps a unique violation to 409 and an RLS denial to 403', async () => {
    const values = { domain: 'gmail.com', policy_type: 'approved', status: 'active', notes: null, dns_status: 'valid', dns_checked_at: null } as const;
    const duplicate = setup(() => ({ status: 409, body: { code: '23505', message: 'duplicate key', details: null, hint: null } }));
    await expect(duplicate.store.insertDomain('t', values)).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
    const denied = setup(() => ({ status: 403, body: { code: '42501', message: 'new row violates row-level security policy', details: null, hint: null } }));
    await expect(denied.store.insertDomain('t', values)).rejects.toMatchObject({ statusCode: 403, code: 'FORBIDDEN' });
  });

  it('reports a delete that matched nothing (missing row or hidden by RLS)', async () => {
    const { store, requests } = setup(() => ({ status: 200, body: [] }));
    await expect(store.deleteDomain('t', 'ed000000-0000-4000-8000-000000000001')).resolves.toBe(false);
    expect(requests[0]?.method).toBe('DELETE');
  });

  it('only sends registration_mode when changing the policy', async () => {
    const { store, requests } = setup(() => ({ status: 200, body: { registration_mode: 'restricted', updated_at: 'x', updated_by: null } }));
    await store.updatePolicy('t', 'restricted');
    expect(requests[0]?.method).toBe('PATCH');
    expect(requests[0]?.body).toEqual({ registration_mode: 'restricted' });
    expect(requests[0]?.url.searchParams.get('id')).toBe('eq.1');
  });
});
