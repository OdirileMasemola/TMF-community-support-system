import { useQuery } from "@tanstack/react-query";
import { ClipboardList, FileCheck, HandCoins, HelpCircle, type LucideIcon } from "lucide-react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { formatCurrency, formatRelativeTime } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchAllAssistanceRequests } from "@/services/assistance";
import { fetchAllDonations } from "@/services/donations";
import { fetchAllApplications } from "@/services/volunteers";

type ActivityItem = {
  id: string;
  title: string;
  timestamp: string;
  sortAt: number;
  icon: LucideIcon;
};

export function DashboardActivity({ className }: { className?: string }) {
  const { data: activities = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-dashboard-activity"],
    enabled: isSupabaseConfigured(),
    queryFn: async (): Promise<ActivityItem[]> => {
      const [donations, applications, assistance] = await Promise.all([
        fetchAllDonations(8),
        fetchAllApplications(8),
        fetchAllAssistanceRequests(8),
      ]);

      const donationItems: ActivityItem[] = donations.map((donation) => {
        const donorName =
          donation.donor_profiles?.profiles?.full_name?.trim() ||
          donation.donor_profiles?.profiles?.email ||
          "A donor";
        return {
          id: `donation-${donation.id}`,
          title: `${donorName} donated ${formatCurrency(donation.amount)}`,
          timestamp: formatRelativeTime(donation.donation_date),
          sortAt: new Date(donation.donation_date).getTime() || 0,
          icon: FileCheck,
        };
      });

      const applicationItems: ActivityItem[] = applications.map((application) => {
        const volunteerName =
          application.volunteer_profiles?.profiles?.full_name?.trim() ||
          application.volunteer_profiles?.profiles?.email ||
          "A volunteer";
        const campaignTitle = application.campaigns?.title ?? "a campaign";
        return {
          id: `application-${application.id}`,
          title: `${volunteerName} applied for ${campaignTitle}`,
          timestamp: formatRelativeTime(application.application_date),
          sortAt: new Date(application.application_date).getTime() || 0,
          icon: HandCoins,
        };
      });

      const assistanceItems: ActivityItem[] = assistance.map((request) => {
        const beneficiaryName =
          request.beneficiary_profiles?.profiles?.full_name?.trim() ||
          request.beneficiary_profiles?.profiles?.email ||
          "A beneficiary";
        return {
          id: `assistance-${request.id}`,
          title: `${beneficiaryName} submitted an assistance request`,
          timestamp: formatRelativeTime(request.request_date),
          sortAt: new Date(request.request_date).getTime() || 0,
          icon: request.request_type ? ClipboardList : HelpCircle,
        };
      });

      return [...donationItems, ...applicationItems, ...assistanceItems]
        .sort((a, b) => b.sortAt - a.sortAt)
        .slice(0, 4);
    },
  });

  return (
    <DashboardCard className={className}>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Latest updates across the foundation workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <DataState
          isLoading={isLoading}
          isError={isError}
          isEmpty={activities.length === 0}
          emptyMessage="No recent activity yet."
          loadingMessage="Loading activity..."
        >
          <ul className="divide-y divide-border">
            {activities.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.timestamp}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </DataState>
      </CardContent>
    </DashboardCard>
  );
}
