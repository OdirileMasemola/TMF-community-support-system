import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, MailOpen } from "lucide-react-native";
import {
  AppButton,
  Badge,
  EmptyRow,
  ErrorState,
  ListRow,
  LoadingState,
  PageHeading,
  Screen,
  SectionCard,
} from "@/components/ui";
import { notificationsQueryKey, useNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime, formatStatusLabel, notificationIsUnread } from "@/lib/display";
import { markAllNotificationsRead, markNotificationRead } from "@/services/notifications";

export function NotificationsScreen() {
  const { userId, notifications, unreadCount, query } = useNotifications();
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey(userId) });

  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(userId!),
    onSuccess: invalidate,
  });

  if (query.isLoading) return <LoadingState label="Loading your notifications…" />;

  return (
    <Screen onRefresh={() => query.refetch()} refreshing={query.isFetching}>
      <PageHeading
        eyebrow="Notifications"
        title={unreadCount ? `${unreadCount} unread` : "You are up to date"}
        subtitle="Updates on your requests, donations and campaign activity."
      />

      {query.isError ? <ErrorState /> : null}

      {unreadCount > 0 ? (
        <AppButton
          label="Mark all as read"
          variant="outline"
          loading={markAll.isPending}
          onPress={() => markAll.mutate()}
        />
      ) : null}

      <SectionCard title="Recent">
        {notifications.length ? (
          notifications.map((item, index) => {
            const unread = notificationIsUnread(item.status);
            return (
              <ListRow
                key={item.id}
                icon={unread ? BellRing : MailOpen}
                label={item.title ?? formatStatusLabel(item.notification_type)}
                value={`${item.message}\n${formatRelativeTime(item.notification_date)}`}
                right={unread ? <Badge label="New" status="unread" /> : undefined}
                last={index === notifications.length - 1}
                onPress={unread ? () => markOne.mutate(item.id) : undefined}
              />
            );
          })
        ) : (
          <EmptyRow label="No notifications yet." />
        )}
      </SectionCard>
    </Screen>
  );
}
