import { useQuery } from "@tanstack/react-query";
import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Delta, DeltaIcon, DeltaValue } from "@/components/efferd/delta";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { formatCurrency } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchAdminDashboardStats } from "@/services/admin";

export function DashboardStats() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    enabled: isSupabaseConfigured(),
    queryFn: fetchAdminDashboardStats,
  });

  const stats = data
    ? [
        { label: "Total Users", value: String(data.totalUsers), delta: 0 },
        { label: "Active Campaigns", value: String(data.activeCampaigns), delta: 0 },
        { label: "Total Donations", value: formatCurrency(data.totalDonationAmount), delta: 0 },
        { label: "Volunteer Applications", value: String(data.volunteerApplications), delta: 0 },
      ]
    : [
        { label: "Total Users", value: "—", delta: 0 },
        { label: "Active Campaigns", value: "—", delta: 0 },
        { label: "Total Donations", value: "—", delta: 0 },
        { label: "Volunteer Applications", value: "—", delta: 0 },
      ];

  return (
    <>
      {stats.map((stat) => (
        <DashboardCard key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DataState
              isLoading={isLoading}
              isError={isError}
              loadingMessage="Loading..."
            >
              <p className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
            </DataState>
          </CardContent>
          <CardFooter className="pt-0 text-xs text-muted-foreground">
            <Delta value={stat.delta}>
              <DeltaIcon />
              <DeltaValue />
            </Delta>
            <span className="ml-1">vs last month</span>
          </CardFooter>
        </DashboardCard>
      ))}
    </>
  );
}
