import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, getSupabaseClientOrNull } from "@/utils/supabase/client";

export { isSupabaseConfigured } from "@/utils/supabase/env";

function requireClient(): SupabaseClient {
  const client = getSupabaseClientOrNull();
  if (!client) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and add your project credentials.",
    );
  }

  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = requireClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export { createClient, getSupabaseClientOrNull };
