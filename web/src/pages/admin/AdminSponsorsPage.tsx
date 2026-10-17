import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { DetailDrawer, DetailList } from "@/components/shared/DetailDrawer";
import { formatCurrency, formatShortDate, formatStatusLabel, paymentStatusLabel } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchAllSponsorshipRequests, fetchAllSponsorships, updateSponsorship } from "@/services/sponsorships";
import type { PaymentStatus } from "@/types/database.types";
import { Skeleton } from "@/components/ui/Spinner";

const sponsorshipStatuses: PaymentStatus[] = ["pending", "successful", "failed", "cancelled"];

async function copyRegistrationLink() {
  const link = `${window.location.origin}/register`;
  try {
    await navigator.clipboard.writeText(link);
    toast.success("Registration link copied. Share it with the person you want to invite.");
  } catch {
    toast.info(`Share this registration link: ${link}`);
  }
}


export function AdminSponsorsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<PaymentStatus>("pending");
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
  const selected = sponsorships.find((item) => item.id === selectedId) ?? null;

  const statusMutation = useMutation({
    mutationFn: () => updateSponsorship(selectedId!, { status }),
    onSuccess: async () => {
      toast.success("Sponsorship updated");
      setSelectedId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-sponsorships"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message || "Could not update sponsorship"),
  });
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

  return (
    <AdminPageShell
      label="Operations"
      title="Sponsor Management"
      description="Review sponsor applications, manage partnerships, and track sponsored campaign contributions."
      actions={
        <Button type="button" onClick={() => void copyRegistrationLink()}>
          Invite sponsor
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-3">
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Active sponsors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? <Skeleton className="mt-1 h-9 w-20" /> : activeSponsors}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? <Skeleton className="mt-1 h-9 w-20" /> : pendingRequests}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total sponsorship value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? <Skeleton className="mt-1 h-9 w-20" /> : formatCurrency(totalValue)}</p>
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
            errorMessage="We could not load sponsorships right now. Please try again shortly."
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedId(sponsor.id);
                          setStatus(sponsor.status);
                        }}
                      >
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

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        eyebrow="Manage sponsorship"
        title={selected?.sponsor_profiles?.organisation_name ?? "Sponsorship"}
        description={selected ? `${formatCurrency(selected.amount)} · ${selected.campaigns?.title ?? "No campaign"}` : null}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSelectedId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={statusMutation.isPending || status === selected?.status} loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate()}
            >
              {statusMutation.isPending ? "Saving..." : "Save status"}
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="space-y-6">
            <DetailList
              items={[
                { label: "Reference", value: selected.id.slice(0, 8) },
                { label: "Organisation", value: selected.sponsor_profiles?.organisation_name ?? "—" },
                {
                  label: "Contact",
                  value: selected.sponsor_profiles?.profiles?.email ? (
                    <a className="text-primary hover:underline" href={`mailto:${selected.sponsor_profiles.profiles.email}`}>
                      {selected.sponsor_profiles.profiles.email}
                    </a>
                  ) : (
                    "—"
                  ),
                },
                {
                  label: "Type",
                  value: formatStatusLabel(selected.sponsorship_type || selected.sponsor_profiles?.sponsorship_type),
                },
                { label: "Level", value: formatStatusLabel(selected.sponsor_profiles?.sponsor_level) },
                { label: "Campaign", value: selected.campaigns?.title ?? "—" },
                { label: "Contribution", value: formatCurrency(selected.amount) },
                { label: "Date", value: formatShortDate(selected.sponsorship_date) },
                { label: "Status", value: <AdminStatusBadge status={paymentStatusLabel(selected.status)} /> },
              ]}
            />
            <label className="block space-y-2 text-sm font-medium text-foreground">
              <span>Update status</span>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value as PaymentStatus)}
              >
                {sponsorshipStatuses.map((value) => (
                  <option key={value} value={value}>
                    {paymentStatusLabel(value)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </DetailDrawer>
    </AdminPageShell>
  );
}
