import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { adminReports } from "@/data/adminManagementData";

export function AdminReportsPage() {
  return (
    <AdminPageShell
      label="Overview"
      title="Reports"
      description="Generate and export operational reports for users, campaigns, donations, volunteers, and system summaries."
      actions={<Button type="button">Generate report</Button>}
    >
      <div className="grid gap-px bg-border lg:grid-cols-2">
        {adminReports.map((report) => (
          <DashboardCard key={report.id}>
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">Last generated: {report.lastGenerated}</p>
              <Button type="button" variant="outline" size="sm">
                Export
              </Button>
            </CardContent>
          </DashboardCard>
        ))}
      </div>
    </AdminPageShell>
  );
}
