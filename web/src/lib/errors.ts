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
  if (/rate limit|too many requests/.test(lower)) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return "We could not complete that request. Please try again.";
}
