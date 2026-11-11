import { createHmac, timingSafeEqual } from 'node:crypto';

/*
 * Signup attestation: proof that an address passed the API's DNS and policy checks.
 *
 * Token: v1.<expiry unix seconds>.<hex HMAC-SHA256(secret, "<normalised email>|<expiry>")>
 *
 * The client puts it in Supabase signUp user_metadata.email_attestation. When the same secret is
 * stored in Supabase Vault ('email_signup_attestation_secret'), the Before User Created hook
 * (private.verify_email_signup_attestation) rejects sign-ups without a valid token, so calling
 * Supabase signUp directly with the public key cannot skip the DNS check.
 * The token is bound to one address and expires; it grants nothing else.
 */

export const ATTESTATION_VERSION = 'v1';
/** Long enough to fill in the rest of the form; the hook rejects anything over an hour. */
export const ATTESTATION_TTL_SECONDS = 15 * 60;

export function attestationSignature(secret: string, email: string, expiry: number): string {
  return createHmac('sha256', secret).update(`${email}|${expiry}`).digest('hex');
}

export function createAttestation(
  secret: string,
  email: string,
  nowMs: number = Date.now(),
  ttlSeconds: number = ATTESTATION_TTL_SECONDS,
): { token: string; expiresAt: Date } {
  const expiry = Math.floor(nowMs / 1000) + ttlSeconds;
  return {
    token: `${ATTESTATION_VERSION}.${expiry}.${attestationSignature(secret, email, expiry)}`,
    expiresAt: new Date(expiry * 1000),
  };
}

/** Same checks as the SQL verifier (used by tests and available to other server code). */
export function verifyAttestation(secret: string, email: string, token: string, nowMs: number = Date.now()): boolean {
  const match = /^v1\.(\d{1,12})\.([0-9a-f]{64})$/.exec(token);
  if (match === null) return false;
  const expiry = Number(match[1]);
  const nowSeconds = Math.floor(nowMs / 1000);
  if (expiry < nowSeconds || expiry > nowSeconds + 3600) return false;
  const expected = Buffer.from(attestationSignature(secret, email, expiry), 'hex');
  const given = Buffer.from(match[2] ?? '', 'hex');
  return expected.length === given.length && timingSafeEqual(expected, given);
}
