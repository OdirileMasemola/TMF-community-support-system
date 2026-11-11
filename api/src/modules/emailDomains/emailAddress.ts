import { domainToASCII, domainToUnicode } from 'node:url';

/*
 * Email address format rules, shared by every registration path in the API. The same rules are in
 * the database (public.normalize_signup_email, used by the Supabase Auth hook), so an address the
 * API accepts is also accepted by the hook and vice versa. supabase/tests/email_domain_management_test.sql
 * covers the SQL side; tests/emailDomains.address.test.ts covers this side with the same cases.
 */

export const MAX_EMAIL_LENGTH = 254;
export const MAX_LOCAL_PART_LENGTH = 64;
export const MAX_DOMAIN_LENGTH = 253;

/** dot-atom local part (RFC 5321/5322 without quoted strings or comments), lower-case ASCII. */
const LOCAL_PART = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
/** 2+ LDH labels, alphabetic or punycode TLD. Same expression as public.email_domain_is_valid(). */
const DOMAIN = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+([a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;
/** Printable ASCII without space. */
const PRINTABLE_ASCII = /^[!-~]+$/;

export type EmailFormatProblem = 'empty' | 'malformed' | 'invalid_local_part' | 'invalid_domain' | 'too_long';

export type NormalisedEmail =
  | {
      ok: true;
      /** Lower-case address with an ASCII (punycode) domain: the value to send to Supabase signUp. */
      email: string;
      localPart: string;
      /** ASCII (punycode) domain, used for DNS and policy checks. */
      domain: string;
      /** Human-readable form of the domain (differs from `domain` only for IDNs). */
      displayDomain: string;
    }
  | { ok: false; problem: EmailFormatProblem };

/** True for a lower-case ASCII domain that passes the syntax rules. */
export function isValidAsciiDomain(domain: string): boolean {
  return domain.length >= 4 && domain.length <= MAX_DOMAIN_LENGTH && DOMAIN.test(domain);
}

/**
 * Normalises an internationalised or ASCII domain to its lower-case ASCII (punycode) form.
 * Returns null when it is not a valid email domain. A trailing dot is not accepted.
 */
export function normaliseDomain(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed.endsWith('.') || /\s/.test(trimmed)) return null;
  // Node's WHATWG IDNA (UTS #46) mapping: lower-cases, NFC-normalises and converts to punycode.
  // It returns '' for input it cannot convert.
  const ascii = domainToASCII(trimmed);
  if (ascii === '' || !isValidAsciiDomain(ascii)) return null;
  return ascii;
}

/**
 * Validates and normalises an email address. Leading/trailing whitespace is trimmed; anything else
 * that is not allowed (inner whitespace, control characters, a second @, quoted local parts,
 * IP-literal domains, non-ASCII local parts) is rejected rather than silently removed.
 */
export function normaliseEmail(raw: unknown): NormalisedEmail {
  if (typeof raw !== 'string') return { ok: false, problem: 'empty' };
  const trimmed = raw.replace(/^[\s\u200B-\u200D\uFEFF]+|[\s\u200B-\u200D\uFEFF]+$/g, '');
  if (trimmed === '') return { ok: false, problem: 'empty' };
  if (trimmed.length > MAX_EMAIL_LENGTH * 4) return { ok: false, problem: 'too_long' };

  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1 || trimmed.indexOf('@') !== at) {
    return { ok: false, problem: 'malformed' };
  }

  const localPart = trimmed.slice(0, at).toLowerCase();
  const rawDomain = trimmed.slice(at + 1);

  if (!PRINTABLE_ASCII.test(localPart) || localPart.length > MAX_LOCAL_PART_LENGTH || !LOCAL_PART.test(localPart)) {
    return { ok: false, problem: 'invalid_local_part' };
  }

  const domain = normaliseDomain(rawDomain);
  if (domain === null) return { ok: false, problem: 'invalid_domain' };

  const email = `${localPart}@${domain}`;
  if (email.length > MAX_EMAIL_LENGTH) return { ok: false, problem: 'too_long' };

  return { ok: true, email, localPart, domain, displayDomain: domainToUnicode(domain) || domain };
}
