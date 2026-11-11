import { describe, expect, it } from 'vitest';
import { normaliseDomain, normaliseEmail } from '../src/modules/emailDomains/emailAddress.js';

// Same cases as section 1 of supabase/tests/email_domain_management_test.sql (the Auth hook's rules).
describe('normaliseEmail', () => {
  it.each([
    ['  Thandi.M@Company.CO.ZA ', 'thandi.m@company.co.za', 'company.co.za'],
    ['user+tag@foundation.org', 'user+tag@foundation.org', 'foundation.org'],
    ['someone@gmail.com', 'someone@gmail.com', 'gmail.com'],
    ['someone@outlook.com', 'someone@outlook.com', 'outlook.com'],
    ['a@xn--bcher-kva.example', 'a@xn--bcher-kva.example', 'xn--bcher-kva.example'],
    ['\u200Bzero.width@trimmed.org\uFEFF', 'zero.width@trimmed.org', 'trimmed.org'],
  ])('accepts %j as %s', (input, email, domain) => {
    expect(normaliseEmail(input)).toMatchObject({ ok: true, email, domain });
  });

  it('converts an internationalised domain to punycode (and keeps the readable form)', () => {
    expect(normaliseEmail('Info@Bücher.Example')).toEqual({
      ok: true,
      email: 'info@xn--bcher-kva.example',
      localPart: 'info',
      domain: 'xn--bcher-kva.example',
      displayDomain: 'bücher.example',
    });
    expect(normaliseEmail('a@пример.рф')).toMatchObject({ ok: true, domain: 'xn--e1afmkfd.xn--p1ai' });
  });

  it.each([
    [undefined, 'empty'],
    [42, 'empty'],
    ['', 'empty'],
    ['   ', 'empty'],
    ['plainaddress', 'malformed'],
    ['no-domain@', 'malformed'],
    ['@no-local.org', 'malformed'],
    ['two@@at.org', 'malformed'],
    ['a@b@c.org', 'malformed'],
    ['sp ace@example.org', 'invalid_local_part'],
    ['"quoted"@example.org', 'invalid_local_part'],
    ['.dot@example.org', 'invalid_local_part'],
    ['dot.@example.org', 'invalid_local_part'],
    ['do..t@example.org', 'invalid_local_part'],
    ['üser@example.org', 'invalid_local_part'],
    [`${'a'.repeat(65)}@example.org`, 'invalid_local_part'],
    ['tab@exa\tmple.org', 'invalid_domain'],
    ['a@localhost', 'invalid_domain'],
    ['a@-bad.org', 'invalid_domain'],
    ['a@bad-.org', 'invalid_domain'],
    ['a@exa_mple.org', 'invalid_domain'],
    ['a@example.c', 'invalid_domain'],
    ['a@example.123', 'invalid_domain'],
    ['a@[127.0.0.1]', 'invalid_domain'],
    ['a@192.168.0.1', 'invalid_domain'],
    ['a@example..org', 'invalid_domain'],
    ['a@example.org.', 'invalid_domain'],
    ['new\nline@example.org', 'invalid_local_part'],
    [`a@${'x'.repeat(250)}.org`, 'invalid_domain'],
  ])('rejects %j (%s)', (input, problem) => {
    expect(normaliseEmail(input)).toEqual({ ok: false, problem });
  });
});

describe('normaliseDomain', () => {
  it('lower-cases, trims and converts IDNs', () => {
    expect(normaliseDomain('  Company.CO.za ')).toBe('company.co.za');
    expect(normaliseDomain('bücher.example')).toBe('xn--bcher-kva.example');
  });

  it.each(['', 'nodot', 'a b.org', 'trailing.org.', '*.example.org', 'exa_mple.org', '127.0.0.1'])('rejects %j', (input) => {
    expect(normaliseDomain(input)).toBeNull();
  });
});
