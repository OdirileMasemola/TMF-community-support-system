import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { adminSponsors } from "@/data/adminManagementData";

export function AdminSponsorsPage() {
  return (
    <AdminPageShell
      label="Operations"
      title="Sponsor Management"
      description="Review sponsor applications, manage partnerships, and track sponsored campaign contributions."
      actions={<Button type="button">Add sponsor</Button>}
    >
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-3">
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Active sponsors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">22</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">2</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total sponsorship value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">R240k</p>
          </CardContent>
        </DashboardCard>
      </div>

      <DashboardCard>
        <CardHeader>
          <CardTitle>Sponsor records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Contribution</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminSponsors.map((sponsor) => (
                <TableRow key={sponsor.id}>
                  <TableCell>{sponsor.id}</TableCell>
                  <TableCell className="font-medium">{sponsor.organisation}</TableCell>
                  <TableCell>{sponsor.type}</TableCell>
                  <TableCell>{sponsor.campaign}</TableCell>
                  <TableCell>{sponsor.amount}</TableCell>
                  <TableCell>
                    <AdminStatusBadge status={sponsor.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button type="button" variant="outline" size="sm">
                      Manage
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
