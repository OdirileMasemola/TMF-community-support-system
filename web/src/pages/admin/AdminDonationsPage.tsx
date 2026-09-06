import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { formatCurrency, formatShortDate, paymentStatusLabel, verificationStatusLabel } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchAllDonations, fetchPendingProofs, updateDonation, updateDonationProof } from "@/services/donations";

export function AdminDonationsPage() {
  const queryClient = useQueryClient();
  const { roleProfileId } = useRoleProfile();

  const donationsQuery = useQuery({
    queryKey: ["admin-donations"],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchAllDonations(100),
  });

  const proofsQuery = useQuery({
    queryKey: ["admin-pending-proofs"],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchPendingProofs(50),
  });

  const donations = donationsQuery.data ?? [];
  const pendingProofs = proofsQuery.data ?? [];

  const updateDonationMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "successful" | "failed" | "cancelled" | "pending" }) =>
      updateDonation(id, { status }),
    onSuccess: async () => {
      toast.success("Donation updated");
      await queryClient.invalidateQueries({ queryKey: ["admin-donations"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message || "Could not update donation"),
  });

  const updateProofMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      updateDonationProof(id, {
        verification_status: status,
        reviewed_by: roleProfileId,
        reviewed_at: new Date().toISOString(),
      }),
    onSuccess: async () => {
      toast.success("Proof updated");
      await queryClient.invalidateQueries({ queryKey: ["admin-pending-proofs"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message || "Could not update proof"),
  });

  const totalAmount = donations
    .filter((donation) => donation.status === "successful")
    .reduce((sum, donation) => sum + Number(donation.amount ?? 0), 0);
  const pendingVerification = donations.filter((donation) => donation.status === "pending").length + pendingProofs.length;
  const today = new Date().toISOString().slice(0, 10);
  const verifiedToday = donations.filter(
    (donation) => donation.status === "successful" && donation.donation_date.slice(0, 10) === today,
  ).length;
  const thisMonthKey = today.slice(0, 7);
  const thisMonthAmount = donations
    .filter((donation) => donation.status === "successful" && donation.donation_date.startsWith(thisMonthKey))
    .reduce((sum, donation) => sum + Number(donation.amount ?? 0), 0);

  const isLoading = donationsQuery.isLoading || proofsQuery.isLoading;
  const isError = donationsQuery.isError || proofsQuery.isError;
  const error = donationsQuery.error ?? proofsQuery.error;

  return (
    <AdminPageShell
      label="Operations"
      title="Donation Management"
      description="Review donation records, verify payment proofs, and track contribution history across campaigns."
      actions={
        <Button type="button" variant="outline">
          Export list
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total donations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : formatCurrency(totalAmount)}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : pendingVerification}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : verifiedToday}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">This month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : formatCurrency(thisMonthAmount)}</p>
          </CardContent>
        </DashboardCard>
      </div>

      <DashboardCard>
        <CardHeader>
          <CardTitle>Recent donations</CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={donationsQuery.isLoading}
            isError={donationsQuery.isError}
            errorMessage="We could not load donations right now. Please try again shortly."
            isEmpty={donations.length === 0}
            emptyMessage="No donations found."
            loadingMessage="Loading donations..."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Donor</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((donation) => {
                  const donorName =
                    donation.donor_profiles?.profiles?.full_name?.trim() ||
                    donation.donor_profiles?.profiles?.email ||
                    "Unknown donor";
                  const reference = donation.payment_reference || donation.receipt_number || donation.id.slice(0, 8);

                  return (
                    <TableRow key={donation.id}>
                      <TableCell>{reference}</TableCell>
                      <TableCell className="font-medium">{donorName}</TableCell>
                      <TableCell>{donation.campaigns?.title ?? "—"}</TableCell>
                      <TableCell>{formatCurrency(donation.amount)}</TableCell>
                      <TableCell>
                        <AdminStatusBadge status={paymentStatusLabel(donation.status)} />
                      </TableCell>
                      <TableCell>{formatShortDate(donation.donation_date)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {donation.status === "pending" ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={updateDonationMutation.isPending}
                                onClick={() => updateDonationMutation.mutate({ id: donation.id, status: "successful" })}
                              >
                                Verify
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={updateDonationMutation.isPending}
                                onClick={() => updateDonationMutation.mutate({ id: donation.id, status: "failed" })}
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Button type="button" variant="outline" size="sm" disabled>
                              Review
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataState>
        </CardContent>
      </DashboardCard>

      <DashboardCard>
        <CardHeader>
          <CardTitle>Pending payment proofs</CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={proofsQuery.isLoading}
            isError={isError && proofsQuery.isError}
            isEmpty={pendingProofs.length === 0}
            emptyMessage="No pending proofs."
            loadingMessage="Loading proofs..."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingProofs.map((proof) => (
                  <TableRow key={proof.id}>
                    <TableCell className="font-medium">{proof.file_name || proof.file_path}</TableCell>
                    <TableCell>{proof.donations?.campaigns?.title ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(proof.donations?.amount)}</TableCell>
                    <TableCell>
                      <AdminStatusBadge status={verificationStatusLabel(proof.verification_status)} />
                    </TableCell>
                    <TableCell>{formatShortDate(proof.uploaded_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={updateProofMutation.isPending}
                          onClick={() => updateProofMutation.mutate({ id: proof.id, status: "approved" })}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={updateProofMutation.isPending}
                          onClick={() => updateProofMutation.mutate({ id: proof.id, status: "rejected" })}
                        >
                          Reject
                        </Button>
                      </div>
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
