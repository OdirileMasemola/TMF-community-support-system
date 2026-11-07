/**
 * Pure helpers for the password-recovery pages. Nothing here touches
 * Supabase or the DOM, so the pages stay thin and these rules can be tested
 * on their own.
 */

/** Same minimum as the registration form (`minLength={8}`) and the mobile app. */
export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** First problem with the email as a sentence, or null when it can be submitted. */
export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Enter your email address.";
  if (!isValidEmail(email)) return "Enter a valid email address.";
  return null;
}

/** First problem with the new password pair, or null when it can be submitted. */
export function validateNewPassword(password: string, confirmPassword: string): string | null {
  if (!password) return "Enter a new password.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!confirmPassword) return "Confirm your new password.";
  if (password !== confirmPassword) return "The passwords do not match.";
  return null;
}

export type RecoveryLinkParams = {
  /** PKCE flow: the one-time code Supabase appends when the request came from this browser. */
  code: string | null;
  /** Implicit flow: tokens arrive in the URL fragment (e.g. when the request came from the mobile app). */
  accessToken: string | null;
  refreshToken: string | null;
  /** `recovery` for password-reset links. */
  type: string | null;
  /** Set when Supabase could not verify the link (expired, already used, malformed). */
  error: { code: string | null; description: string } | null;
};

/**
 * Supabase puts link results in the query string (PKCE) or the fragment
 * (implicit flow and most errors). Both are read so the page can tell a
 * usable link from a failed one without caring which flow produced it.
 */
export function parseRecoveryLink(href: string): RecoveryLinkParams {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { code: null, accessToken: null, refreshToken: null, type: null, error: null };
  }

  const query = url.searchParams;
  const fragment = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
  const read = (key: string) => fragment.get(key) ?? query.get(key);

  const errorCode = read("error_code");
  const errorDescription = read("error_description");
  const errorName = read("error");
  const error =
    errorCode || errorDescription || errorName
      ? {
          code: errorCode,
          description: (errorDescription ?? errorName ?? "").replace(/\+/g, " "),
        }
      : null;

  return {
    code: query.get("code"),
    accessToken: fragment.get("access_token"),
    refreshToken: fragment.get("refresh_token"),
    type: read("type"),
    error,
  };
}

/** User-facing copy for a link that Supabase rejected. */
export function describeRecoveryLinkError(error: NonNullable<RecoveryLinkParams["error"]>): string {
  const code = (error.code ?? "").toLowerCase();
  const description = error.description.toLowerCase();

  if (code === "otp_expired" || /expired/.test(description)) {
    return "This reset link has expired or has already been used. Please request a new one.";
  }
  if (code === "access_denied" || /invalid/.test(description)) {
    return "This reset link is invalid. Please request a new one.";
  }
  return "We could not verify this reset link. Please request a new one.";
}
