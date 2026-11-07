/**
 * Reads the result of a Supabase password-reset link out of the deep link
 * that opened the app. The mobile client runs the implicit flow, so a good
 * link carries the tokens in the URL fragment:
 *
 *   tmfdashboard://reset-password#access_token=…&refresh_token=…&type=recovery
 *
 * and a bad one (expired, already used) carries an error instead:
 *
 *   tmfdashboard://reset-password#error=access_denied&error_code=otp_expired&error_description=…
 *
 * Query-string parameters are read as well so the same code copes if the
 * project is ever switched to PKCE (`?code=`).
 */

export type RecoveryLink =
  | { kind: "tokens"; accessToken: string; refreshToken: string; type: string | null }
  | { kind: "code"; code: string }
  | { kind: "error"; code: string | null; description: string }
  | { kind: "none" };

export function parseRecoveryLink(url: string | null | undefined): RecoveryLink {
  if (!url) return { kind: "none" };

  const hashIndex = url.indexOf("#");
  const beforeHash = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? "" : url.slice(hashIndex + 1);
  const queryIndex = beforeHash.indexOf("?");
  const query = queryIndex === -1 ? "" : beforeHash.slice(queryIndex + 1);

  const fragmentParams = new URLSearchParams(fragment);
  const queryParams = new URLSearchParams(query);
  const read = (key: string) => fragmentParams.get(key) ?? queryParams.get(key);

  const errorCode = read("error_code");
  const errorDescription = read("error_description");
  const errorName = read("error");
  if (errorCode || errorDescription || errorName) {
    return {
      kind: "error",
      code: errorCode,
      description: (errorDescription ?? errorName ?? "").replace(/\+/g, " "),
    };
  }

  const accessToken = read("access_token");
  const refreshToken = read("refresh_token");
  if (accessToken && refreshToken) {
    return { kind: "tokens", accessToken, refreshToken, type: read("type") };
  }

  const code = read("code");
  if (code) return { kind: "code", code };

  return { kind: "none" };
}

/** Plain-language explanation for a link Supabase refused. */
export function describeRecoveryLinkError(link: Extract<RecoveryLink, { kind: "error" }>): string {
  const code = (link.code ?? "").toLowerCase();
  const description = link.description.toLowerCase();

  if (code === "otp_expired" || /expired/.test(description)) {
    return "This reset link has expired or has already been used. Please request a new one.";
  }
  if (code === "access_denied" || /invalid/.test(description)) {
    return "This reset link is invalid. Please request a new one.";
  }
  return "We could not verify this reset link. Please request a new one.";
}

/** Maps Supabase auth errors raised while finishing a reset to copy the user can act on. */
export function describeRecoveryFailure(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (/different from the old password|same_password/.test(message)) {
    return "Your new password must be different from your current password.";
  }
  if (/password should (be|contain)|weak password|weak_password/.test(message)) {
    return "That password is too weak. Use at least 8 characters, mixing letters, numbers and symbols.";
  }
  if (/auth session missing|session_not_found|not authenticated|refresh token/.test(message)) {
    return "This reset link has expired. Please request a new one.";
  }
  if (/invalid or has expired|otp_expired|token has expired|invalid token|already been used/.test(message)) {
    return "This reset link is invalid or has expired. Please request a new one.";
  }
  if (/network request failed|failed to fetch|network/.test(message)) {
    return "We could not reach the server. Check your connection and try again.";
  }
  if (/rate limit|too many requests|security purposes/.test(message)) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return fallback;
}
