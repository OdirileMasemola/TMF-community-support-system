import { Card } from "@/components/ui/Card";

export function NotificationsPage() {
  return (
    <div>
      <h1 className="page-title">Notifications</h1>
      <p className="page-description">Users receive updates, confirmations, alerts, and request status changes.</p>

      <Card className="mt-6">
        <h2 className="text-lg font-bold">No notifications yet</h2>
        <p className="mt-2 text-muted-foreground">Connect this page to the notifications table.</p>
      </Card>
    </div>
  );
}
