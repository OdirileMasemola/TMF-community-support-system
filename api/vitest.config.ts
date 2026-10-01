import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Dummy values for tests only. Creating the Supabase client makes no network call.
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
    },
  },
});
