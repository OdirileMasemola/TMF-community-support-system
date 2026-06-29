import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv, isSupabaseConfigured } from "@/utils/supabase/env";

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and add your project credentials.",
    );
  }

  if (!client) {
    const { url, key } = getSupabaseEnv();
    client = createBrowserClient(url!, key!);
  }

  return client;
}

export function getSupabaseClientOrNull(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient();
}
