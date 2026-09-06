import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CircleCheck, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchAdminDashboardStats } from "@/services/admin";
import { fetchAllDonations } from "@/services/donations";
import { fetchCampaigns } from "@/services/campaigns";

function ratioPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function OperationalHealth({ className }: { className?: string }) {
  const statsQuery = useQuery({
    queryKey: ["admin-dashboard-stats"],
    enabled: isSupabaseConfigured(),
    queryFn: fetchAdminDashboardStats,
  });
  const donationsQuery = useQuery({
    queryKey: ["admin-donations", 200],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchAllDonations(200),
  });
  const campaignsQuery = useQuery({
    queryKey: ["admin-campaigns", 100],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchCampaigns({ limit: 100 }),
  });

  const stats = statsQuery.data;
  const donations = donationsQuery.data ?? [];
  const campaigns = campaignsQuery.data ?? [];
  const verifiedDonations = donations.filter((donation) => donation.status === "successful").length;
  const data = stats
    ? {
        verifiedDonationRatio: ratioPercent(verifiedDonations, donations.length),
        activeCampaignRatio: ratioPercent(stats.activeCampaigns, campaigns.length || stats.activeCampaigns),
        pendingReviews: stats.pendingReviews,
        caughtUp: stats.pendingReviews === 0,
      }
    : undefined;

  const isLoading = statsQuery.isLoading || donationsQuery.isLoading || campaignsQuery.isLoading;
  const isError = statsQuery.isError || donationsQuery.isError || campaignsQuery.isError;

  const caughtUp = data?.caughtUp ?? true;

  return (
    <DashboardCard className={className}>
      <CardHeader>
        <CardTitle>Operational health</CardTitle>
        <CardDescription>
          {isLoading
            ? "Checking operational status..."
            : caughtUp
              ? "Nothing urgent needs your attention."
              : `${data?.pendingReviews ?? 0} items need review.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <DataState
          isLoading={isLoading}
          isError={isError}
          loadingMessage="Loading health metrics..."
        >
          <div
            className={
              caughtUp
                ? "flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"
                : "flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600"
            }
          >
            {caughtUp ? (
              <CircleCheck className="size-5" aria-hidden="true" />
            ) : (
              <CircleAlert className="size-5" aria-hidden="true" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{caughtUp ? "You're caught up." : "Attention needed."}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Verified donations {data?.verifiedDonationRatio ?? 0}% · Active campaigns {data?.activeCampaignRatio ?? 0}%
            </p>
          </div>
          <Button type="button" variant="link" size="sm" className="h-auto px-0" to="/admin/donations">
            Review pending items
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </DataState>
      </CardContent>
    </DashboardCard>
  );
}
