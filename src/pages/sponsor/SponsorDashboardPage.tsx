import {
  ArrowRight,
  Bell,
  ClipboardList,
  HandCoins,
  HeartHandshake,
  Package,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { sponsorQuickActions } from "@/data/sponsorDashboardData";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { resolveCampaignImage } from "@/lib/campaignImages";
import {
  campaignProgress,
  campaignStatusLabel,
  formatCurrency,
  formatMonthYear,
  formatRelativeTime,
  formatShortDate,
  formatStatusLabel,
  getInitials,
  notificationIsUnread,
} from "@/lib/display";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import type { SponsorProfile } from "@/services/profiles";
import {
  fetchOpenSponsorshipRequests,
  fetchSponsorSponsorships,
  type SponsorshipWithCampaign,
} from "@/services/sponsorships";

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function PriorityBadge({ priority }: { priority: string }) {
  const normalized = formatStatusLabel(priority);
  const tone =
    normalized === "High"
      ? "bg-destructive/10 text-destructive"
      : normalized === "Medium"
        ? "bg-secondary text-secondary-foreground"
        : "bg-primary/10 text-primary";

  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>{normalized}</span>;
}

function CampaignStatusBadge({ status }: { status: string }) {
  const label = campaignStatusLabel(status);
  const tone =
    label === "Active"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : label === "Draft"
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground";

  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>{label}</span>;
}

function mapSponsoredCampaign(row: SponsorshipWithCampaign) {
  const campaign = row.campaigns;
  return {
    id: row.id,
    title: campaign?.title ?? "Campaign",
    category: campaign?.category ?? "General",
    status: campaign?.status ?? "closed",
    supportAmount: formatCurrency(row.amount),
    progress: campaignProgress(campaign?.amount_raised, campaign?.funding_goal),
    image: resolveCampaignImage(campaign?.image_url, campaign?.title, campaign?.category),
  };
}

export function SponsorDashboardPage() {
  const { profile } = useAuth();
  const { roleProfile, roleProfileId, isLoading: roleLoading } = useRoleProfile();
  const sponsorProfile = (roleProfile as SponsorProfile | null) ?? null;
  const { notifications, isLoading: notificationsLoading } = useNotifications(5);

  const sponsorshipsQuery = useQuery({
    queryKey: ["sponsor-sponsorships", roleProfileId],
    enabled: Boolean(isSupabaseConfigured() && roleProfileId),
    queryFn: () => fetchSponsorSponsorships(roleProfileId!),
  });

  const requestsQuery = useQuery({
    queryKey: ["open-sponsorship-requests"],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchOpenSponsorshipRequests(),
  });

  const sponsorships = sponsorshipsQuery.data ?? [];
  const requests = requestsQuery.data ?? [];

  const organisationName = sponsorProfile?.organisation_name || profile?.full_name || "Sponsor";
  const greetingName = organisationName;
  const initials = getInitials(organisationName);
  const sponsorLevel = formatStatusLabel(sponsorProfile?.sponsor_level) || "Partner";
  const memberSince = formatMonthYear(sponsorProfile?.created_at);

  const totalAmount = sponsorships.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const activeCampaignIds = new Set(
    sponsorships
      .filter((row) => row.campaigns?.status === "active" && (row.status === "successful" || row.status === "pending"))
      .map((row) => row.campaign_id)
      .filter(Boolean),
  );

  const statistics = [
    {
      id: "sponsored-campaigns",
      title: "Sponsored Campaigns",
      value: String(sponsorships.length),
      detail: "Total sponsorship records",
      icon: HeartHandshake,
    },
    {
      id: "active-sponsorships",
      title: "Active Campaigns Supported",
      value: String(activeCampaignIds.size),
      detail: "Currently supporting communities",
      icon: HandCoins,
    },
    {
      id: "resources-donated",
      title: "Total Contributed",
      value: formatCurrency(totalAmount),
      detail: "Financial sponsorship value",
      icon: Package,
    },
    {
      id: "open-requests",
      title: "Open Requests",
      value: String(requests.length),
      detail: "Sponsorship opportunities available",
      icon: TrendingUp,
    },
  ];

  const impactMetrics = [
    {
      id: "total-sponsorships",
      label: "Sponsorships Made",
      value: String(sponsorships.length),
      icon: HeartHandshake,
    },
    {
      id: "total-contributed",
      label: "Total Contributed",
      value: formatCurrency(totalAmount),
      icon: Package,
    },
    {
      id: "campaigns-supported",
      label: "Campaigns Supported",
      value: String(new Set(sponsorships.map((row) => row.campaign_id).filter(Boolean)).size),
      icon: HandCoins,
    },
    {
      id: "active-supported",
      label: "Active Campaigns",
      value: String(activeCampaignIds.size),
      icon: TrendingUp,
    },
  ];

  const featuredCampaigns = useMemo(
    () => sponsorships.slice(0, 2).map(mapSponsoredCampaign),
    [sponsorships],
  );

  const featuredRequests = requests.slice(0, 2);
  const recentActivities = sponsorships.slice(0, 5);
  const recentUpdates = notifications.slice(0, 3);

  const pageLoading = roleLoading || sponsorshipsQuery.isLoading || requestsQuery.isLoading;
  const pageError = sponsorshipsQuery.isError || requestsQuery.isError;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Sponsor workspace</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              {initials}
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{timeOfDayGreeting()},</p>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Welcome back, {greetingName}
              </h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Thank you for supporting our community initiatives.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Sponsor level:</span>{" "}
              <span className="font-medium text-foreground">{sponsorLevel} Sponsor</span>
            </p>
            <p>
              <span className="text-muted-foreground">Member since:</span>{" "}
              <span className="font-medium text-foreground">{memberSince}</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button to="/sponsor/campaigns">
            <HeartHandshake className="mr-2 size-4" />
            View Sponsored Campaigns
          </Button>
          <Button to="/sponsor/sponsorships" variant="outline">
            <HandCoins className="mr-2 size-4" />
            Sponsor New Campaign
          </Button>
        </div>
      </header>

      <DataState
        isLoading={pageLoading}
        isError={pageError}
        errorMessage="We could not load your sponsor dashboard right now."
        loadingMessage="Loading your sponsor workspace..."
      >
        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {statistics.map((stat) => {
            const Icon = stat.icon;
            return (
              <DashboardCard key={stat.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{stat.detail}</p>
                </CardContent>
              </DashboardCard>
            );
          })}

          <DashboardCard className="col-span-2 lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle>Sponsored campaigns</CardTitle>
                <CardDescription>Campaigns your organisation currently supports.</CardDescription>
              </div>
              <Button to="/sponsor/campaigns" variant="ghost" size="sm" className="shrink-0">
                View All
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <DataState isEmpty={featuredCampaigns.length === 0} emptyMessage="You have not sponsored any campaigns yet.">
                {featuredCampaigns.map((campaign) => (
                  <article key={campaign.id} className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                    <img
                      src={campaign.image}
                      alt=""
                      className="hidden h-20 w-28 shrink-0 object-cover sm:block"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{campaign.category}</p>
                          <p className="mt-1 font-medium text-foreground">{campaign.title}</p>
                        </div>
                        <CampaignStatusBadge status={campaign.status} />
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Support: <span className="text-foreground">{campaign.supportAmount}</span>
                      </p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{campaign.progress}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-primary" style={{ width: `${campaign.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </DataState>
            </CardContent>
          </DashboardCard>

          <DashboardCard className="col-span-2 lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle>Sponsorship requests</CardTitle>
                <CardDescription>Opportunities looking for organisational partners.</CardDescription>
              </div>
              <Button to="/sponsor/requests" variant="ghost" size="sm" className="shrink-0">
                View All
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <DataState isEmpty={featuredRequests.length === 0} emptyMessage="No open sponsorship requests right now.">
                {featuredRequests.map((request) => (
                  <article key={request.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <ClipboardList className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{request.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{request.category ?? "General"}</p>
                        </div>
                      </div>
                      <PriorityBadge priority={request.priority ?? "normal"} />
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>
                        Support: <span className="text-foreground">{request.requested_support}</span>
                      </p>
                      <p>
                        Deadline: <span className="text-foreground">{formatShortDate(request.deadline)}</span>
                      </p>
                      <p>
                        Impact: <span className="text-foreground">{request.estimated_impact ?? "—"}</span>
                      </p>
                    </div>
                    <Button to="/sponsor/requests" variant="ghost" size="sm" className="mt-3 px-0">
                      View request
                      <ArrowRight className="ml-1.5 size-3.5" />
                    </Button>
                  </article>
                ))}
              </DataState>
            </CardContent>
          </DashboardCard>

          {impactMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <DashboardCard key={metric.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{metric.value}</p>
                </CardContent>
              </DashboardCard>
            );
          })}

          <DashboardCard className="col-span-2">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Your latest sponsorship actions and updates.</CardDescription>
              </div>
              <Button to="/sponsor/history" variant="ghost" size="sm" className="shrink-0">
                View Activity
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              <DataState isEmpty={recentActivities.length === 0} emptyMessage="No sponsorship activity yet.">
                {recentActivities.map((activity) => (
                  <RecentActivityCard
                    key={activity.id}
                    title={`Sponsored ${activity.campaigns?.title ?? "a campaign"}`}
                    description={`${formatCurrency(activity.amount)} · ${formatStatusLabel(activity.status)}`}
                    timestamp={formatRelativeTime(activity.sponsorship_date)}
                    icon={HandCoins}
                  />
                ))}
              </DataState>
            </CardContent>
          </DashboardCard>

          <DashboardCard className="col-span-2">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div>
                <CardTitle>Foundation updates</CardTitle>
                <CardDescription>Important updates for TMF organisational partners.</CardDescription>
              </div>
              <Button to="/sponsor/notifications" variant="ghost" size="sm" className="shrink-0">
                View All
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <DataState
                isLoading={notificationsLoading}
                isEmpty={recentUpdates.length === 0}
                emptyMessage="No foundation updates yet."
              >
                {recentUpdates.map((update) => (
                  <article
                    key={update.id}
                    className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                      <Bell className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{update.title ?? update.notification_type}</p>
                        {notificationIsUnread(update.status) && (
                          <PriorityBadge priority="High" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{update.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{formatRelativeTime(update.notification_date)}</p>
                    </div>
                  </article>
                ))}
              </DataState>
            </CardContent>
          </DashboardCard>

          <DashboardCard className="col-span-2 lg:col-span-4">
            <CardHeader>
              <CardTitle>Your partnership creates lasting impact.</CardTitle>
              <CardDescription>
                Thank you for standing with the Themba Molefe Foundation. Your organisation&apos;s support helps
                families, learners, and communities across Gauteng.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HeartHandshake className="size-5" aria-hidden="true" />
              </span>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button to="/sponsor/sponsorships" size="sm">
                  <HandCoins className="mr-2 size-4" />
                  Sponsor Another Campaign
                </Button>
                <Button to="/sponsor/campaigns" variant="outline" size="sm">
                  <HeartHandshake className="mr-2 size-4" />
                  Review Your Campaigns
                </Button>
              </div>
            </CardContent>
          </DashboardCard>
        </div>
      </DataState>

      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-foreground md:text-2xl">Quick actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Jump into common sponsorship workflows.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sponsorQuickActions.map((action) => (
            <QuickActionCard
              key={action.id}
              title={action.title}
              description={action.description}
              icon={action.icon}
              route={action.route}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
