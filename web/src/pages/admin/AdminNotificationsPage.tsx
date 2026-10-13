import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime, formatStatusLabel, notificationIsUnread } from "@/lib/display";
import { cn } from "@/lib/utils";
import { NotificationInbox } from "@/components/shared/NotificationInbox";

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
            <NotificationInbox notifications={notifications} markRead={markRead} />
          </DataState>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}
