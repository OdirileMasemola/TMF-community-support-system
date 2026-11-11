import { Resolver } from 'node:dns/promises';

/*
 * Checks whether a domain is configured to receive email, using Node's built-in resolver.
 *
 *   1. MX records (RFC 5321 section 5.1). A "Null MX" (a single MX with an empty exchange, RFC 7505)
 *      means the domain explicitly accepts no mail.
 *   2. No MX records at all: the implicit MX rule, i.e. the domain's own A or AAAA record.
 *   3. The domain does not exist, or has neither: not configured for email.
 *
 * Temporary failures (timeouts, SERVFAIL, refused, network errors) are reported as 'unavailable'
 * and are never cached, so they are not mistaken for "no mail configuration".
 *
 * This only shows that mail for the domain has somewhere to go. It does NOT show that a mailbox
 * exists or that the person registering owns it: that is what Supabase's confirmation email is for.
 */

export type DnsMailStatus = 'valid' | 'invalid' | 'unavailable';
export type DnsMailMethod = 'mx' | 'implicit_a' | 'implicit_aaaa';

export interface DnsMailResult {
  status: DnsMailStatus;
  /** How a valid domain was confirmed. */
  method?: DnsMailMethod;
  /** Why the domain is invalid or the check failed (server-side detail; never shown to users). */
  reason?: 'nxdomain' | 'null_mx' | 'no_mail_records' | 'timeout' | 'dns_error';
  /** True when served from the cache. */
  cached: boolean;
}

/** The subset of node:dns/promises Resolver used here (injectable for tests). */
export interface MailDnsResolver {
  resolveMx(hostname: string): Promise<Array<{ exchange: string; priority: number }>>;
  resolve4(hostname: string): Promise<string[]>;
  resolve6(hostname: string): Promise<string[]>;
  cancel?(): void;
}

export interface DnsValidatorOptions {
  /** Defaults to a new node:dns/promises Resolver with the timeout below. */
  resolver?: MailDnsResolver;
  /** Upper bound for a whole check (all lookups), in ms. */
  timeoutMs?: number;
  /** How long a 'valid' result is reused. */
  positiveTtlMs?: number;
  /** How long an 'invalid' result is reused (shorter, so a newly configured domain works soon). */
  negativeTtlMs?: number;
  /** Most domains kept in the cache; the oldest entry is evicted first. */
  maxEntries?: number;
  now?: () => number;
}

export interface DomainMailValidator {
  check(asciiDomain: string): Promise<DnsMailResult>;
  /** Drops cached results (one domain, or everything). */
  forget(asciiDomain?: string): void;
}

/** Error codes meaning "this name/record does not exist" (not temporary). */
const NOT_FOUND_CODES = new Set(['ENOTFOUND', 'ENODATA', 'NOTFOUND', 'NODATA']);
const NXDOMAIN_CODES = new Set(['ENOTFOUND', 'NOTFOUND']);
const TIMEOUT_CODES = new Set(['ETIMEOUT', 'TIMEOUT', 'ECANCELLED', 'CANCELLED']);

class DnsTimeoutError extends Error {
  readonly code = 'ETIMEOUT';
}

function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : '';
}

type Lookup<T> = { ok: true; value: T } | { ok: false; notFound: boolean; nxdomain: boolean; timeout: boolean };

async function lookup<T>(run: () => Promise<T>): Promise<Lookup<T>> {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    const code = errorCode(error);
    return {
      ok: false,
      notFound: NOT_FOUND_CODES.has(code),
      nxdomain: NXDOMAIN_CODES.has(code),
      timeout: error instanceof DnsTimeoutError || TIMEOUT_CODES.has(code),
    };
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, onTimeout: () => void): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      onTimeout();
      reject(new DnsTimeoutError('DNS lookup timed out'));
    }, timeoutMs);
    timer.unref();
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export const DEFAULT_DNS_TIMEOUT_MS = 3000;
export const DEFAULT_POSITIVE_TTL_MS = 60 * 60 * 1000;
export const DEFAULT_NEGATIVE_TTL_MS = 10 * 60 * 1000;
export const DEFAULT_MAX_CACHE_ENTRIES = 1000;

export function createDomainMailValidator(options: DnsValidatorOptions = {}): DomainMailValidator {
  const timeoutMs = options.timeoutMs ?? DEFAULT_DNS_TIMEOUT_MS;
  const positiveTtlMs = options.positiveTtlMs ?? DEFAULT_POSITIVE_TTL_MS;
  const negativeTtlMs = options.negativeTtlMs ?? DEFAULT_NEGATIVE_TTL_MS;
  const maxEntries = options.maxEntries ?? DEFAULT_MAX_CACHE_ENTRIES;
  const now = options.now ?? Date.now;
  const resolver: MailDnsResolver =
    options.resolver ?? new Resolver({ timeout: Math.max(500, Math.floor(timeoutMs / 2)), tries: 2 });

  const cache = new Map<string, { result: Omit<DnsMailResult, 'cached'>; expiresAt: number }>();
  /** Concurrent checks of the same domain share one lookup. */
  const inFlight = new Map<string, Promise<Omit<DnsMailResult, 'cached'>>>();

  function remember(domain: string, result: Omit<DnsMailResult, 'cached'>): void {
    if (result.status === 'unavailable') return;
    cache.delete(domain);
    if (cache.size >= maxEntries) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(domain, { result, expiresAt: now() + (result.status === 'valid' ? positiveTtlMs : negativeTtlMs) });
  }

  async function resolve(domain: string): Promise<Omit<DnsMailResult, 'cached'>> {
    const mx = await lookup(() => resolver.resolveMx(domain));
    if (mx.ok) {
      const usable = mx.value.filter((record) => record.exchange.replace(/\.$/, '') !== '');
      if (usable.length > 0) return { status: 'valid', method: 'mx' };
      if (mx.value.length > 0) return { status: 'invalid', reason: 'null_mx' };
      // An empty answer is the same as "no MX records": fall through to the implicit MX rule.
    } else if (mx.nxdomain) {
      return { status: 'invalid', reason: 'nxdomain' };
    } else if (!mx.notFound) {
      return { status: 'unavailable', reason: mx.timeout ? 'timeout' : 'dns_error' };
    }

    const [a, aaaa] = await Promise.all([lookup(() => resolver.resolve4(domain)), lookup(() => resolver.resolve6(domain))]);
    if (a.ok && a.value.length > 0) return { status: 'valid', method: 'implicit_a' };
    if (aaaa.ok && aaaa.value.length > 0) return { status: 'valid', method: 'implicit_aaaa' };
    const temporary = [a, aaaa].find((result) => !result.ok && !result.notFound);
    if (temporary !== undefined && !temporary.ok) {
      return { status: 'unavailable', reason: temporary.timeout ? 'timeout' : 'dns_error' };
    }
    return { status: 'invalid', reason: 'no_mail_records' };
  }

  return {
    async check(asciiDomain: string): Promise<DnsMailResult> {
      const domain = asciiDomain.toLowerCase();
      const hit = cache.get(domain);
      if (hit !== undefined) {
        if (hit.expiresAt > now()) return { ...hit.result, cached: true };
        cache.delete(domain);
      }

      let pending = inFlight.get(domain);
      if (pending === undefined) {
        pending = withTimeout(resolve(domain), timeoutMs, () => resolver.cancel?.())
          .catch((error: unknown): Omit<DnsMailResult, 'cached'> => ({
            status: 'unavailable',
            reason: error instanceof DnsTimeoutError ? 'timeout' : 'dns_error',
          }))
          .then((result) => {
            remember(domain, result);
            return result;
          })
          .finally(() => inFlight.delete(domain));
        inFlight.set(domain, pending);
      }
      return { ...(await pending), cached: false };
    },

    forget(asciiDomain?: string): void {
      if (asciiDomain === undefined) cache.clear();
      else cache.delete(asciiDomain.toLowerCase());
    },
  };
}
