import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { ProfilePictureEditor } from "@/components/shared/ProfilePictureEditor";

export function AdminSettingsPage() {
  return (
    <AdminPageShell
      label="Administration"
      title="System Settings"
      description="Configure platform preferences, notification rules, and administrator access controls."
    >
      <div className="grid gap-px bg-border lg:grid-cols-2">
        <DashboardCard>
          <CardHeader>
            <CardTitle>Your profile picture</CardTitle>
            <CardDescription>Dashboard users can change this photo 3 times. After that it is locked.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <ProfilePictureEditor />
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>General settings</CardTitle>
            <CardDescription>Foundation profile and default platform configuration.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="form-grid">
              <Input label="Foundation name" defaultValue="Themba Molefe Foundation" />
              <Input label="Support email" defaultValue="support@tmf.org.za" />
              <Input label="Default timezone" defaultValue="Africa/Johannesburg" />
              <Button type="button">Save changes</Button>
            </form>
          </CardContent>
        </DashboardCard>

        <DashboardCard>
          <CardHeader>
            <CardTitle>Notification preferences</CardTitle>
            <CardDescription>Control administrator alerts for operational activity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Email alerts for new donations, volunteer applications, and assistance requests.</p>
            <p>In-app notifications for campaign deadlines and sponsor review requests.</p>
            <Button type="button" variant="outline">
              Configure alerts
            </Button>
          </CardContent>
        </DashboardCard>
      </div>
    </AdminPageShell>
  );
}
