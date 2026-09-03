import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { formatCurrency, formatStatusLabel, paymentStatusLabel } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchAllSponsorshipRequests, fetchAllSponsorships } from "@/services/sponsorships";

export function AdminSponsorsPage() {
  const sponsorshipsQuery = useQuery({
    queryKey: ["admin-sponsorships"],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchAllSponsorships(100),
  });

  const requestsQuery = useQuery({
    queryKey: ["admin-sponsorship-requests"],
    enabled: isSupabaseConfigured(),
    queryFn: fetchAllSponsorshipRequests,
  });

  const sponsorships = sponsorshipsQuery.data ?? [];
  const requests = requestsQuery.data ?? [];

  const activeSponsors = new Set(
    sponsorships.filter((item) => item.status === "successful").map((item) => item.sponsor_id),
  ).size;
  const pendingRequests = requests.filter((request) => request.status === "open").length;
  const totalValue = sponsorships
    .filter((item) => item.status === "successful")
    .reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

  const isLoading = sponsorshipsQuery.isLoading || requestsQuery.isLoading;
  const isError = sponsorshipsQuery.isError || requestsQuery.isError;
  const error = sponsorshipsQuery.error ?? requestsQuery.error;

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
            <p className="text-3xl font-semibold">{isLoading ? "—" : activeSponsors}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : pendingRequests}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total sponsorship value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : formatCurrency(totalValue)}</p>
          </CardContent>
        </DashboardCard>
      </div>

      <DashboardCard>
        <CardHeader>
          <CardTitle>Sponsor records</CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={sponsorshipsQuery.isLoading}
            isError={sponsorshipsQuery.isError}
            errorMessage={sponsorshipsQuery.error instanceof Error ? sponsorshipsQuery.error.message : undefined}
            isEmpty={sponsorships.length === 0}
            emptyMessage="No sponsorships found."
            loadingMessage="Loading sponsorships..."
          >
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
                {sponsorships.map((sponsor) => (
                  <TableRow key={sponsor.id}>
                    <TableCell>{sponsor.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">
                      {sponsor.sponsor_profiles?.organisation_name ?? "Unknown organisation"}
                    </TableCell>
                    <TableCell>
                      {formatStatusLabel(sponsor.sponsorship_type || sponsor.sponsor_profiles?.sponsorship_type)}
                    </TableCell>
                    <TableCell>{sponsor.campaigns?.title ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(sponsor.amount)}</TableCell>
                    <TableCell>
                      <AdminStatusBadge status={paymentStatusLabel(sponsor.status)} />
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
          </DataState>
        </CardContent>
      </DashboardCard>

      <DashboardCard>
        <CardHeader>
          <CardTitle>Sponsorship requests</CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={requestsQuery.isLoading}
            isError={isError && requestsQuery.isError}
            isEmpty={requests.length === 0}
            emptyMessage="No sponsorship requests found."
            loadingMessage="Loading requests..."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Support</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.title}</TableCell>
                    <TableCell>{request.campaigns?.title ?? "—"}</TableCell>
                    <TableCell>{request.requested_support}</TableCell>
                    <TableCell>{formatStatusLabel(request.priority)}</TableCell>
                    <TableCell>
                      <AdminStatusBadge status={formatStatusLabel(request.status)} />
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
