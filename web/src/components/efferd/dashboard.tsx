import { useQuery } from "@tanstack/react-query";
import { PendingActionCard } from "@/components/dashboard/PendingActionCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { DashboardActivity } from "@/components/efferd/dashboard-activity";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DonationTrendsChart } from "@/components/efferd/donation-trends-chart";
import { OperationalHealth } from "@/components/efferd/operational-health";
import { ProgrammeActivityChart } from "@/components/efferd/programme-activity-chart";
import { RecentDonationsTable } from "@/components/efferd/recent-donations-table";
import { DashboardStats as DashboardStatsSection } from "@/components/efferd/stats";
import { DataState } from "@/components/shared/DataState";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { quickActions, type PendingAction } from "@/data/adminDashboardData";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchAdminDashboardStats } from "@/services/admin";

export function Dashboard() {
  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    enabled: isSupabaseConfigured(),
    queryFn: fetchAdminDashboardStats,
  });

  const pendingActions: PendingAction[] = [
    {
      id: "pending-volunteers",
      title: "Pending Volunteer Applications",
      count: stats?.pendingVolunteerApplications ?? 0,
      priority: "High",
    },
    {
      id: "pending-donations",
      title: "Pending Donation Verifications",
      count: stats?.pendingDonationProofs ?? 0,
      priority: "High",
    },
    {
      id: "pending-sponsors",
      title: "Pending Sponsor Requests",
      count: stats?.openSponsorshipRequests ?? 0,
      priority: "Medium",
    },
    {
      id: "pending-assistance",
      title: "Pending Assistance Requests",
      count: stats?.pendingAssistanceRequests ?? 0,
      priority: "High",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Administrator</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Dashboard Overview</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
          Monitor foundation activities, community support programmes, donations, volunteers, sponsorships, and
          operational performance from one central dashboard.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
        <DashboardStatsSection />
        <DonationTrendsChart className="col-span-2" />
        <ProgrammeActivityChart className="col-span-2" />
        <RecentDonationsTable className="col-span-2 lg:col-span-3" />
        <OperationalHealth className="col-span-2 lg:col-span-1" />
        <DashboardActivity className="col-span-2 lg:col-span-4" />
      </div>

      <div className="grid gap-px bg-border lg:grid-cols-2">
        <DashboardCard>
          <CardHeader>
            <CardTitle>Items requiring attention</CardTitle>
            <CardDescription>Pending reviews and operational follow-ups.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <DataState
              isLoading={isLoading}
              isError={isError}
              loadingMessage="Loading pending items..."
            >
              {pendingActions.map((action) => (
                <PendingActionCard key={action.id} title={action.title} count={action.count} priority={action.priority} />
              ))}
            </DataState>
          </CardContent>
        </DashboardCard>

        <DashboardCard>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump into common administrator workflows.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {quickActions.slice(0, 4).map((action) => (
              <QuickActionCard
                key={action.id}
                title={action.title}
                description={action.description}
                icon={action.icon}
                route={action.route}
              />
            ))}
          </CardContent>
        </DashboardCard>
      </div>
    </div>
  );
}
