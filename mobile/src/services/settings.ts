import type { Tables, ThemePreference } from "@/types/database.types";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";

export type UserSettings = Tables<"user_settings">;

export const THEME_PREFERENCES: ReadonlyArray<ThemePreference> = ["light", "dark", "system"];

/** The columns a user may change; user_id and the timestamps are managed by the database. */
export const SETTINGS_WRITABLE_FIELDS = [
  "theme_preference",
  "notify_campaign_updates",
  "notify_request_updates",
  "notify_donation_updates",
] as const;

export type SettingsPatch = Partial<Pick<UserSettings, (typeof SETTINGS_WRITABLE_FIELDS)[number]>>;

const SETTINGS_COLUMNS =
  "user_id, theme_preference, notify_campaign_updates, notify_request_updates, notify_donation_updates, created_at, updated_at";

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference);
}

/**
 * Reads the caller's user_settings row (RLS: "Users view own settings").
 * The row is normally created by a trigger when the profile is created; if it
 * is missing, the default row is inserted first ("Users create own settings"),
 * on conflict do nothing.
 */
export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  const client = getSupabaseClientOrNull();
  if (!client) return null;

  const read = () => client.from("user_settings").select(SETTINGS_COLUMNS).eq("user_id", userId).maybeSingle();

  const { data, error } = await read();
  if (error) {
    logSupabaseError("fetchUserSettings", error);
    throw error;
  }
  if (data) return data;

  const { error: insertError } = await client
    .from("user_settings")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  if (insertError) {
    logSupabaseError("fetchUserSettings.createDefault", insertError);
    throw insertError;
  }

  const { data: created, error: rereadError } = await read();
  if (rereadError) {
    logSupabaseError("fetchUserSettings.reread", rereadError);
    throw rereadError;
  }
  return created;
}

/** Saves some of the caller's settings ("Users update own settings") and returns the updated row. */
export async function updateUserSettings(userId: string, patch: SettingsPatch): Promise<UserSettings> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");

  const values: SettingsPatch = {};
  for (const field of SETTINGS_WRITABLE_FIELDS) {
    if (patch[field] !== undefined) {
      Object.assign(values, { [field]: patch[field] });
    }
  }

  if (Object.keys(values).length === 0) throw new Error("Choose a setting to change.");
  if (values.theme_preference !== undefined && !isThemePreference(values.theme_preference)) {
    throw new Error("Choose light, dark or system.");
  }

  const { data, error } = await client
    .from("user_settings")
    .update(values)
    .eq("user_id", userId)
    .select(SETTINGS_COLUMNS)
    .single();

  if (error) {
    logSupabaseError("updateUserSettings", error);
    throw error;
  }
  return data;
}
