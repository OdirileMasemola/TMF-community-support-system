import type { Tables, TablesInsert, TablesUpdate } from "@/types/database.types";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";
import { logSupabaseError } from "@/lib/errors";

export type NotificationRow = Tables<"notifications">;

export async function fetchNotifications(userId: string, limit = 50): Promise<NotificationRow[]> {
  const client = getSupabaseClientOrNull();
  if (!client) return [];

  const { data, error } = await client
    .from("notifications")
    .select(
      "id, user_id, message, notification_date, notification_type, status, title, link_url, related_entity_type, related_entity_id",
    )
    .eq("user_id", userId)
    .order("notification_date", { ascending: false })
    .limit(limit);

  if (error) {
    logSupabaseError("fetchNotifications", error);
    throw error;
  }

  return data ?? [];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");

  const { error } = await client.from("notifications").update({ status: "read" }).eq("id", notificationId);
  if (error) {
    logSupabaseError("markNotificationRead", error);
    throw error;
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");

  const { error } = await client.from("notifications").update({ status: "read" }).eq("user_id", userId).eq("status", "unread");
  if (error) {
    logSupabaseError("markAllNotificationsRead", error);
    throw error;
  }
}

export async function createNotification(payload: TablesInsert<"notifications">): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");

  const { error } = await client.from("notifications").insert(payload);
  if (error) {
    logSupabaseError("createNotification", error);
    throw error;
  }
}

export async function updateNotification(id: string, values: TablesUpdate<"notifications">): Promise<void> {
  const client = getSupabaseClientOrNull();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("notifications").update(values).eq("id", id);
  if (error) {
    logSupabaseError("updateNotification", error);
    throw error;
  }
}
