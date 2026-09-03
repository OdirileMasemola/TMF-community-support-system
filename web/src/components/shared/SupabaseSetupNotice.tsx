import { isSupabaseConfigured } from "@/lib/supabaseClient";

export function SupabaseSetupNotice() {
  if (isSupabaseConfigured()) {
    return null;
  }

  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <p className="font-semibold">Supabase is not configured yet.</p>
      <p className="mt-1">
        Copy <code className="rounded bg-amber-100 px-1">.env.example</code> to{" "}
        <code className="rounded bg-amber-100 px-1">.env.local</code>, add your Supabase URL and
        anon key, then restart the dev server. Public pages work without it; login and registration
        need Supabase.
      </p>
    </div>
  );
}
