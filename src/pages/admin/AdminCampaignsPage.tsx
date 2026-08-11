import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { campaignStatusLabel, formatCurrency, formatShortDate } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchCampaigns } from "@/services/campaigns";

export function AdminCampaignsPage() {
  const { data: campaigns = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-campaigns"],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchCampaigns(),
  });

  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active").length;
  const pendingReview = campaigns.filter((campaign) => campaign.status === "draft").length;
  const completed = campaigns.filter((campaign) => campaign.status === "closed").length;
  const totalRaised = campaigns.reduce((sum, campaign) => sum + Number(campaign.amount_raised ?? 0), 0);

  return (
    <AdminPageShell
      label="Operations"
      title="Campaign Management"
      description="Create, review, and monitor foundation campaigns, funding progress, and campaign deadlines."
      actions={<Button type="button">Create campaign</Button>}
    >
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Active campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : activeCampaigns}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : pendingReview}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : completed}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total raised</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : formatCurrency(totalRaised)}</p>
          </CardContent>
        </DashboardCard>
      </div>

      <DashboardCard>
        <CardHeader>
          <CardTitle>All campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={isLoading}
            isError={isError}
            isEmpty={campaigns.length === 0}
            emptyMessage="No campaigns found."
            loadingMessage="Loading campaigns..."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Raised</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.title}</TableCell>
                    <TableCell>
                      <AdminStatusBadge status={campaignStatusLabel(campaign.status)} />
                    </TableCell>
                    <TableCell>{campaign.location}</TableCell>
                    <TableCell>{formatCurrency(campaign.amount_raised)}</TableCell>
                    <TableCell>{formatCurrency(campaign.funding_goal)}</TableCell>
                    <TableCell>{formatShortDate(campaign.end_date)}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm">
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataState>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}
