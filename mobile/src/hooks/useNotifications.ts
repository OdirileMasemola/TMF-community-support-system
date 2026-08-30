import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { notificationIsUnread } from "@/lib/display";
import { fetchNotifications } from "@/services/notifications";

export function notificationsQueryKey(userId: string | undefined) {
  return ["notifications", userId] as const;
}

/** Shared by the portal top-bar badge and the notifications screen. */
export function useNotifications() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const query = useQuery({
    queryKey: notificationsQueryKey(userId),
    enabled: Boolean(isSupabaseConfigured() && userId),
    queryFn: () => fetchNotifications(userId!),
  });

  const unreadCount = useMemo(
    () => (query.data ?? []).filter((row) => notificationIsUnread(row.status)).length,
    [query.data],
  );

  return { userId, notifications: query.data ?? [], unreadCount, query };
}
