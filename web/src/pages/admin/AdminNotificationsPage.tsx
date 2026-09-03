import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime, formatStatusLabel, notificationIsUnread } from "@/lib/display";
import { cn } from "@/lib/utils";

export function AdminNotificationsPage() {
  const { notifications, isLoading, isError, error, markAllRead, markRead } = useNotifications();

  return (
    <AdminPageShell
      label="Administration"
      title="Notifications"
      description="Review system alerts, operational updates, and items requiring administrator attention."
      actions={
        <Button
          type="button"
          variant="outline"
          disabled={markAllRead.isPending || notifications.length === 0}
          onClick={() => markAllRead.mutate()}
        >
          Mark all read
        </Button>
      }
    >
      <DashboardCard>
        <CardHeader>
          <CardTitle>Recent notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={isLoading}
            isError={isError}
            isEmpty={notifications.length === 0}
            emptyMessage="No notifications yet."
            loadingMessage="Loading notifications..."
          >
            <ul className="divide-y divide-border">
              {notifications.map((notification) => {
                const unread = notificationIsUnread(notification.status);
                return (
                  <li
                    key={notification.id}
                    className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <button
                      type="button"
                      className="min-w-0 text-left"
                      onClick={() => {
                        if (unread) markRead.mutate(notification.id);
                      }}
                    >
                      <p className={cn("font-medium text-foreground", unread && "text-primary")}>
                        {notification.title?.trim() || notification.message}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatStatusLabel(notification.notification_type)} ·{" "}
                        {formatRelativeTime(notification.notification_date)}
                      </p>
                    </button>
                    {unread ? (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </DataState>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}
