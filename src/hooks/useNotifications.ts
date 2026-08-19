import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/notifications";

export function useNotifications(limit = 50) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const enabled = Boolean(isSupabaseConfigured() && userId);

  const query = useQuery({
    queryKey: ["notifications", userId, limit],
    enabled,
    queryFn: () => fetchNotifications(userId!, limit),
  });

  const markRead = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllNotificationsRead(userId!),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((item) => item.status === "unread").length;

  return {
    notifications,
    unreadCount,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    markRead,
    markAllRead,
    refetch: query.refetch,
  };
}
