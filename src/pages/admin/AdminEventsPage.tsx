import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { adminEvents } from "@/data/adminManagementData";

export function AdminEventsPage() {
  return (
    <AdminPageShell
      label="Administration"
      title="Event Management"
      description="Schedule, update, and monitor foundation community events and volunteer assignments."
      actions={<Button type="button">Create event</Button>}
    >
      <div className="grid gap-px bg-border lg:grid-cols-3">
        {adminEvents.map((event) => (
          <DashboardCard key={event.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle>{event.title}</CardTitle>
                <AdminStatusBadge status={event.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{event.date}</p>
              <p>{event.location}</p>
              <p>{event.volunteers} volunteers assigned</p>
              <Button type="button" variant="outline" size="sm" className="mt-3">
                Manage event
              </Button>
            </CardContent>
          </DashboardCard>
        ))}
      </div>
    </AdminPageShell>
  );
}
