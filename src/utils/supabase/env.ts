export function getSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseEnv();
  return Boolean(url && key);
}
