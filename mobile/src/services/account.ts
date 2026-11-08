import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";

/*
 * Permanently deletes the signed-in user's account.
 * The delete_own_account() database function removes the auth user, and the
 * database cascades remove the profile, settings and notifications.
 * Donation records are kept without the donor link.
 */
export async function deleteOwnAccount(): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");

  const { error } = await client.rpc("delete_own_account");
  if (error) {
    logSupabaseError("deleteOwnAccount", error);
    throw error;
  }

  // The session belongs to a user that no longer exists, so clear it locally
  await client.auth.signOut({ scope: "local" });
}
