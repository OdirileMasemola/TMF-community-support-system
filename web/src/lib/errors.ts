/** Log technical details in development without exposing them in the UI. */
export function logSupabaseError(context: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.error(`[Supabase] ${context}`, error);
  }
}

function rawMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  return "";
}

/**
 * Safe copy for data-loading failures. Never forwards SQL, grants, or stack text.
 */
export function toUserMessage(fallback = "Something went wrong while loading data. Please try again."): string {
  return fallback;
}

/** Auth errors that are safe to show; everything else is generic. */
export function toAuthUserMessage(error: unknown): string {
  const message = rawMessage(error);
  const lower = message.toLowerCase();

  if (/invalid login|invalid credentials|invalid email or password/.test(lower)) {
    return "Incorrect email or password.";
  }
  if (/email not confirmed/.test(lower)) {
    return "Please confirm your email address before signing in.";
  }
  if (/user already registered|already been registered/.test(lower)) {
    return "An account with this email already exists. Try signing in.";
  }
  if (/rate limit|too many requests|security purposes/.test(lower)) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (/failed to fetch|network|load failed/.test(lower)) {
    return "We could not reach the server. Check your connection and try again.";
  }

  // Password recovery
  if (/different from the old password|same_password/.test(lower)) {
    return "Your new password must be different from your current password.";
  }
  if (/password should (be|contain)|weak password|weak_password/.test(lower)) {
    return "That password is too weak. Use at least 8 characters, mixing letters, numbers and symbols.";
  }
  if (/code verifier|flow state|both auth code and code verifier/.test(lower)) {
    return "This link must be opened in the same browser you started from. Please start again from this browser.";
  }
  if (/invalid or has expired|otp_expired|token has expired|invalid token|already been used/.test(lower)) {
    return "This link is invalid or has expired. Please request a new one.";
  }
  if (/error sending|smtp|email.*(not|un)available|sending recovery email/.test(lower)) {
    return "We could not send the email right now. Please try again later or contact the foundation.";
  }

  return "We could not complete that request. Please try again.";
}
