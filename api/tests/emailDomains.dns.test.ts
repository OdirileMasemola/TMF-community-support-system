import { describe, expect, it } from 'vitest';
import { createDomainMailValidator } from '../src/modules/emailDomains/dnsValidator.js';
import { MockDnsResolver, standardDnsAnswers } from './helpers/emailDomains.js';

// DNS is always mocked: no test depends on the network.
function setup(overrides: Partial<Parameters<typeof createDomainMailValidator>[0]> = {}) {
  const resolver = new MockDnsResolver(standardDnsAnswers());
  let clock = 1_000_000;
  const validator = createDomainMailValidator({
    resolver,
    timeoutMs: 50,
    positiveTtlMs: 60_000,
    negativeTtlMs: 10_000,
    now: () => clock,
    ...overrides,
  });
  return { resolver, validator, advance: (ms: number) => (clock += ms) };
}

describe('domain mail DNS validation', () => {
  it.each(['gmail.com', 'outlook.com', 'company.co.za', 'foundation.org', 'xn--bcher-kva.example'])('accepts %s via MX', async (domain) => {
    const { validator } = setup();
    await expect(validator.check(domain)).resolves.toEqual({ status: 'valid', method: 'mx', cached: false });
  });

  it('falls back to the A record when there is no MX (implicit MX)', async () => {
    const { validator, resolver } = setup();
    await expect(validator.check('a-only.example')).resolves.toMatchObject({ status: 'valid', method: 'implicit_a' });
    expect(resolver.calls.map((c) => c.type)).toEqual(['MX', 'A', 'AAAA']);
  });

  it('falls back to the AAAA record when there is no MX or A', async () => {
    const { validator } = setup();
    await expect(validator.check('aaaa-only.example')).resolves.toMatchObject({ status: 'valid', method: 'implicit_aaaa' });
  });

  it('rejects a domain that does not exist without further lookups', async () => {
    const { validator, resolver } = setup();
    await expect(validator.check('does-not-exist.example')).resolves.toEqual({ status: 'invalid', reason: 'nxdomain', cached: false });
    expect(resolver.calls).toHaveLength(1);
  });

  it('rejects a domain with no MX, A or AAAA records', async () => {
    const { validator } = setup();
    await expect(validator.check('no-mail.example')).resolves.toMatchObject({ status: 'invalid', reason: 'no_mail_records' });
  });

  it('rejects a Null MX (RFC 7505) even when the domain has an A record', async () => {
    const { validator, resolver } = setup();
    await expect(validator.check('null-mx.example')).resolves.toMatchObject({ status: 'invalid', reason: 'null_mx' });
    expect(resolver.calls.map((c) => c.type)).toEqual(['MX']);
  });

  it('reports a timeout as unavailable (not invalid) and cancels outstanding queries', async () => {
    const { validator, resolver } = setup();
    await expect(validator.check('slow.example')).resolves.toEqual({ status: 'unavailable', reason: 'timeout', cached: false });
    expect(resolver.cancelled).toBe(1);
  });

  it('reports SERVFAIL and resolver timeouts as unavailable', async () => {
    const { validator, resolver } = setup();
    await expect(validator.check('broken.example')).resolves.toMatchObject({ status: 'unavailable', reason: 'dns_error' });
    resolver.answers['timeout.example'] = 'timeout';
    await expect(validator.check('timeout.example')).resolves.toMatchObject({ status: 'unavailable', reason: 'timeout' });
  });

  it('treats an A lookup failure after a missing MX as unavailable, not invalid', async () => {
    const { validator, resolver } = setup();
    resolver.answers['partial.example'] = {};
    const original = resolver.resolve4.bind(resolver);
    resolver.resolve4 = async (host) => (host === 'partial.example' ? Promise.reject(Object.assign(new Error('x'), { code: 'ESERVFAIL' })) : original(host));
    await expect(validator.check('partial.example')).resolves.toMatchObject({ status: 'unavailable' });
  });

  it('caches valid results for the positive TTL', async () => {
    const { validator, resolver, advance } = setup();
    await validator.check('gmail.com');
    await expect(validator.check('GMAIL.com')).resolves.toMatchObject({ status: 'valid', cached: true });
    expect(resolver.calls).toHaveLength(1);
    advance(60_001);
    await expect(validator.check('gmail.com')).resolves.toMatchObject({ cached: false });
    expect(resolver.calls).toHaveLength(2);
  });

  it('caches invalid results for the shorter negative TTL', async () => {
    const { validator, resolver, advance } = setup();
    await validator.check('no-mail.example');
    advance(9_000);
    await expect(validator.check('no-mail.example')).resolves.toMatchObject({ status: 'invalid', cached: true });
    advance(1_001);
    resolver.answers['no-mail.example'] = { mx: [{ exchange: 'mx.no-mail.example', priority: 1 }] };
    await expect(validator.check('no-mail.example')).resolves.toMatchObject({ status: 'valid', cached: false });
  });

  it('never caches temporary failures', async () => {
    const { validator, resolver } = setup();
    await validator.check('broken.example');
    resolver.answers['broken.example'] = { mx: [{ exchange: 'mx.broken.example', priority: 1 }] };
    await expect(validator.check('broken.example')).resolves.toMatchObject({ status: 'valid', cached: false });
  });

  it('shares one lookup between concurrent checks and evicts the oldest entry when full', async () => {
    const { validator, resolver } = setup({ maxEntries: 2 });
    await Promise.all([validator.check('gmail.com'), validator.check('gmail.com'), validator.check('gmail.com')]);
    expect(resolver.calls).toHaveLength(1);
    await validator.check('outlook.com');
    await validator.check('company.co.za');
    await expect(validator.check('gmail.com')).resolves.toMatchObject({ cached: false });
  });

  it('forget() drops cached answers', async () => {
    const { validator } = setup();
    await validator.check('gmail.com');
    validator.forget('gmail.com');
    await expect(validator.check('gmail.com')).resolves.toMatchObject({ cached: false });
  });
});
