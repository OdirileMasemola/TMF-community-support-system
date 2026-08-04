import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { adminNotifications } from "@/data/adminManagementData";
import { cn } from "@/lib/utils";

export function AdminNotificationsPage() {
  return (
    <AdminPageShell
      label="Administration"
      title="Notifications"
      description="Review system alerts, operational updates, and items requiring administrator attention."
      actions={<Button type="button" variant="outline">Mark all read</Button>}
    >
      <DashboardCard>
        <CardHeader>
          <CardTitle>Recent notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {adminNotifications.map((notification) => (
              <li key={notification.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div>
                  <p className={cn("font-medium text-foreground", notification.unread && "text-primary")}>
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.category} · {notification.timestamp}
                  </p>
                </div>
                {notification.unread ? (
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}
