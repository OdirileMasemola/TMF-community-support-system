import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, type AppStateStatus } from "react-native";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseEnv, isSupabaseConfigured } from "@/utils/supabase/env";

export { isSupabaseConfigured } from "@/utils/supabase/env";

export type TypedSupabaseClient = SupabaseClient<Database>;

let client: TypedSupabaseClient | null = null;
let appStateSubscribed = false;

export function createClient(): TypedSupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and add your project credentials.",
    );
  }

  if (!client) {
    const { url, key } = getSupabaseEnv();
    client = createSupabaseClient<Database>(url!, key!, {
      auth: {
        // React Native has no cookie store, so the session lives in AsyncStorage
        // instead of the cookie-based persistence the web app gets from @supabase/ssr.
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        // There is no URL to parse a session out of outside the browser.
        detectSessionInUrl: false,
      },
    });

    subscribeToAppState(client);
  }

  return client;
}

export function getSupabaseClientOrNull(): TypedSupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createClient();
}

export const supabase = new Proxy({} as TypedSupabaseClient, {
  get(_target, prop, receiver) {
    const resolved = createClient();
    const value = Reflect.get(resolved, prop, receiver);
    return typeof value === "function" ? value.bind(resolved) : value;
  },
});

/**
 * Token auto-refresh uses timers, which the OS suspends in the background.
 * Restarting it on foreground keeps a backgrounded app from waking with a dead session.
 */
function subscribeToAppState(instance: TypedSupabaseClient) {
  if (appStateSubscribed) return;
  appStateSubscribed = true;

  AppState.addEventListener("change", (status: AppStateStatus) => {
    if (status === "active") {
      instance.auth.startAutoRefresh();
    } else {
      instance.auth.stopAutoRefresh();
    }
  });
}
