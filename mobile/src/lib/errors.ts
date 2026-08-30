/** Log technical details in development without exposing them in the UI. */
export function logSupabaseError(context: string, error: unknown): void {
  if (__DEV__) {
    console.error(`[Supabase] ${context}`, error);
  }
}

export function toUserMessage(fallback = "Something went wrong while loading data. Please try again."): string {
  return fallback;
}
