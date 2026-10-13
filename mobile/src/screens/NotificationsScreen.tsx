import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { BellRing, MailOpen } from "lucide-react-native";
import { DetailRows, DetailSheet } from "@/components/DetailSheet";
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
import { formatDateTime, formatRelativeTime, formatStatusLabel, notificationIsUnread } from "@/lib/display";
import { markAllNotificationsRead, markNotificationRead, type NotificationRow } from "@/services/notifications";
import { useThemedStyles } from "@/theme/ThemeProvider";
import { typography, type ThemeColors } from "@/theme/tokens";

function notificationTitle(item: NotificationRow) {
  return item.title?.trim() || formatStatusLabel(item.notification_type);
}

export function NotificationsScreen() {
  const { userId, notifications, unreadCount, query } = useNotifications();
  const queryClient = useQueryClient();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = notifications.find((item) => item.id === selectedId) ?? null;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey(userId) });

  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(userId!),
    onSuccess: invalidate,
  });

  const open = (item: NotificationRow) => {
    setSelectedId(item.id);
    if (notificationIsUnread(item.status)) markOne.mutate(item.id);
  };

  if (query.isLoading) return <LoadingState label="Loading your notifications…" />;

  const link = selected?.link_url?.trim();
  const internalLink = link?.startsWith("/") ? link : null;

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
                label={notificationTitle(item)}
                value={`${item.message ?? ""}\n${formatRelativeTime(item.notification_date)}`}
                right={unread ? <Badge label="New" status="unread" /> : undefined}
                last={index === notifications.length - 1}
                onPress={() => open(item)}
              />
            );
          })
        ) : (
          <EmptyRow label="No notifications yet." />
        )}
      </SectionCard>

      <DetailSheet
        visible={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        eyebrow="Notification"
        title={selected ? notificationTitle(selected) : ""}
        subtitle={selected ? formatDateTime(selected.notification_date) : undefined}
        footer={
          <>
            {internalLink ? (
              <AppButton
                label="Open related page"
                variant="outline"
                onPress={() => {
                  setSelectedId(null);
                  router.push(internalLink as never);
                }}
              />
            ) : null}
            <AppButton label="Done" onPress={() => setSelectedId(null)} />
          </>
        }
      >
        {selected ? (
          <>
            <Text style={styles.message}>{selected.message ?? ""}</Text>
            <DetailRows
              rows={[
                { label: "Type", value: formatStatusLabel(selected.notification_type) },
                { label: "Received", value: formatRelativeTime(selected.notification_date) },
                ...(selected.related_entity_type
                  ? [{ label: "Related to", value: formatStatusLabel(selected.related_entity_type) }]
                  : []),
              ]}
            />
          </>
        ) : null}
      </DetailSheet>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    message: {
      ...typography.body,
      lineHeight: 22,
      color: colors.foreground,
    },
  });
