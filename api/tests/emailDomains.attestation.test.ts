import { describe, expect, it } from 'vitest';
import { attestationSignature, createAttestation, verifyAttestation } from '../src/modules/emailDomains/attestation.js';

const SECRET = 'local-test-secret-0123456789abcdef';
const NOW = Date.UTC(2026, 10, 12, 10, 0, 0);

describe('signup attestation', () => {
  it('uses the same HMAC as the Supabase hook (pgcrypto hmac(..., sha256))', () => {
    // Same literal as supabase/tests/email_domain_management_test.sql section 9.
    expect(attestationSignature(SECRET, 'thandi@company.co.za', 1893456000)).toBe(
      'e6317a68073cf2b38dbe6d7fd2346b59d9a11a6eda6532006b0ada0424a8c224',
    );
  });

  it('creates a v1 token bound to the address that expires after 15 minutes', () => {
    const { token, expiresAt } = createAttestation(SECRET, 'thandi@company.co.za', NOW);
    expect(token).toMatch(/^v1\.\d+\.[0-9a-f]{64}$/);
    expect(expiresAt.getTime()).toBe(NOW + 15 * 60 * 1000);
    expect(verifyAttestation(SECRET, 'thandi@company.co.za', token, NOW)).toBe(true);
    expect(verifyAttestation(SECRET, 'someone@company.co.za', token, NOW)).toBe(false);
    expect(verifyAttestation('another-secret-0123456789abcdef!!', 'thandi@company.co.za', token, NOW)).toBe(false);
    expect(verifyAttestation(SECRET, 'thandi@company.co.za', token, NOW + 16 * 60 * 1000)).toBe(false);
  });

  it('rejects malformed tokens and tokens valid for more than an hour', () => {
    expect(verifyAttestation(SECRET, 'a@b.org', 'v1.abc.def', NOW)).toBe(false);
    const long = createAttestation(SECRET, 'a@b.org', NOW, 2 * 3600).token;
    expect(verifyAttestation(SECRET, 'a@b.org', long, NOW)).toBe(false);
  });
});
