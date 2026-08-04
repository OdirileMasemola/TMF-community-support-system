import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardCard } from "@/components/efferd/dashboard-card";

const donations = [
  { id: "DN-1045", donor: "Northwind Community Trust", amount: "R2,400.00", status: "Verified" },
  { id: "DN-1044", donor: "Blue River Foundation", amount: "R890.00", status: "Pending" },
  { id: "DN-1043", donor: "Oak Street Outreach", amount: "R5,120.00", status: "Verified" },
  { id: "DN-1042", donor: "Harbor Support Group", amount: "R310.50", status: "Review" },
] as const;

export function RecentDonationsTable({ className }: { className?: string }) {
  return (
    <DashboardCard className={className}>
      <CardHeader>
        <CardTitle>Recent donations</CardTitle>
        <CardDescription>Open amounts and verification status.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption className="sr-only">Recent donations with donor, amount, and status.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Donor</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((donation) => (
              <TableRow key={donation.id}>
                <TableCell className="font-medium">{donation.donor}</TableCell>
                <TableCell className="text-muted-foreground">#{donation.id}</TableCell>
                <TableCell className="text-right">{donation.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <Button type="button" variant="link" size="sm" className="h-auto px-0">
          View all
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </CardFooter>
    </DashboardCard>
  );
}
