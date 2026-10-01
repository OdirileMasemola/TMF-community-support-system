import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    /** Server-side Supabase client using the publishable key (anon role, subject to RLS). */
    supabase: SupabaseClient;
    /**
     * Creates a Supabase client that acts as the calling user: requests carry the user's
     * access token, so Row Level Security applies to that user. Create one per request.
     */
    createUserClient: (accessToken: string) => SupabaseClient;
  }
}

/**
 * Creates a Supabase client from SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY.
 * No service-role key is used. Session persistence/refresh is disabled because the
 * server is stateless; creating a client makes no network call.
 */
export function createSupabaseClient(
  config: Pick<AppConfig, 'supabaseUrl' | 'supabasePublishableKey'>,
  accessToken?: string,
): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    ...(accessToken === undefined ? {} : { global: { headers: { Authorization: `Bearer ${accessToken}` } } }),
  });
}

/** Decorates the root instance with `supabase` and `createUserClient`. */
export function registerSupabase(app: FastifyInstance, config: AppConfig): void {
  app.decorate('supabase', createSupabaseClient(config));
  app.decorate('createUserClient', (accessToken: string) => createSupabaseClient(config, accessToken));
}
