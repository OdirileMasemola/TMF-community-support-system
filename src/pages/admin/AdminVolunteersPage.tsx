import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { adminVolunteers } from "@/data/adminManagementData";

export function AdminVolunteersPage() {
  return (
    <AdminPageShell
      label="Operations"
      title="Volunteer Management"
      description="Review volunteer applications, approve assignments, and monitor volunteer participation."
      actions={<Button type="button" variant="outline">View all applications</Button>}
    >
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">37</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">5</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Active volunteers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">24</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">This week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">+5</p>
          </CardContent>
        </DashboardCard>
      </div>

      <DashboardCard>
        <CardHeader>
          <CardTitle>Volunteer applications</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminVolunteers.map((volunteer) => (
                <TableRow key={volunteer.id}>
                  <TableCell>{volunteer.id}</TableCell>
                  <TableCell className="font-medium">{volunteer.name}</TableCell>
                  <TableCell>{volunteer.campaign}</TableCell>
                  <TableCell>{volunteer.submitted}</TableCell>
                  <TableCell>
                    <AdminStatusBadge status={volunteer.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="outline" size="sm">
                      {volunteer.status === "Pending" ? "Review" : "View"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}
