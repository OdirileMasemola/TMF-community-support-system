import type { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { getSupabaseEnv, isSupabaseConfigured } from "@/utils/supabase/env";

export type TypedSupabaseClient = SupabaseClient<Database>;

let client: TypedSupabaseClient | null = null;

export function createClient(): TypedSupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and add your project credentials.",
    );
  }

  if (!client) {
    const { url, key } = getSupabaseEnv();
    client = createBrowserClient<Database>(url!, key!);
  }

  return client;
}

export function getSupabaseClientOrNull(): TypedSupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient();
}
