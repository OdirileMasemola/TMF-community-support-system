import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { formatCurrency, paymentStatusLabel } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchAllDonations } from "@/services/donations";

export function RecentDonationsTable({ className }: { className?: string }) {
  const { data: donations = [], isLoading, isError } = useQuery({
    queryKey: ["admin-donations", 200],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchAllDonations(200),
    select: (rows) => rows.slice(0, 5),
  });

  return (
    <DashboardCard className={className}>
      <CardHeader>
        <CardTitle>Recent donations</CardTitle>
        <CardDescription>Open amounts and verification status.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataState
          isLoading={isLoading}
          isError={isError}
          isEmpty={donations.length === 0}
          emptyMessage="No donations yet."
          loadingMessage="Loading donations..."
        >
          <Table>
            <TableCaption className="sr-only">Recent donations with donor, amount, and status.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Donor</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
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
                    <TableCell className="font-medium">{donorName}</TableCell>
                    <TableCell className="text-muted-foreground">#{reference}</TableCell>
                    <TableCell className="text-muted-foreground">{paymentStatusLabel(donation.status)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(donation.amount)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataState>
      </CardContent>
      <CardFooter>
        <Button type="button" variant="link" size="sm" className="h-auto px-0" to="/admin/donations">
          View all
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </CardFooter>
    </DashboardCard>
  );
}
