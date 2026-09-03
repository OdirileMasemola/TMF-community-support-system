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
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-operational-health"],
    enabled: isSupabaseConfigured(),
    queryFn: async () => {
      const [stats, donations, campaigns] = await Promise.all([
        fetchAdminDashboardStats(),
        fetchAllDonations(500),
        fetchCampaigns(),
      ]);

      const verifiedDonations = donations.filter((donation) => donation.status === "successful").length;
      const verifiedDonationRatio = ratioPercent(verifiedDonations, donations.length);
      const activeCampaignRatio = ratioPercent(stats.activeCampaigns, campaigns.length || stats.activeCampaigns);
      const pendingReviews = stats.pendingReviews;

      return {
        verifiedDonationRatio,
        activeCampaignRatio,
        pendingReviews,
        caughtUp: pendingReviews === 0,
      };
    },
  });

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
