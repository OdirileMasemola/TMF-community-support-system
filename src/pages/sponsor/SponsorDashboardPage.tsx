import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { HandCoins, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { SponsoredCampaignCard } from "@/components/dashboard/SponsoredCampaignCard";
import { SponsorCampaignCard } from "@/components/dashboard/SponsorCampaignCard";
import { SponsorshipHistoryCard } from "@/components/dashboard/SponsorshipHistoryCard";
import { SponsorshipRequestCard } from "@/components/dashboard/SponsorshipRequestCard";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SectionReveal } from "@/components/ui/SectionReveal";
import {
  campaignsToSponsor,
  communityImpactMetrics,
  foundationUpdates,
  sponsoredCampaigns,
  sponsorActivities,
  sponsorProfile,
  sponsorshipHistory,
  sponsorshipRequests,
  sponsorQuickActions,
  sponsorStatistics,
  type UpdatePriority,
} from "@/data/sponsorDashboardData";
import { cn } from "@/lib/utils";

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function PriorityBadge({ priority }: { priority: UpdatePriority }) {
  const tone =
    priority === "High"
      ? "bg-destructive/10 text-destructive"
      : priority === "Medium"
        ? "bg-secondary text-secondary-foreground"
        : "bg-primary/10 text-primary";

  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>{priority}</span>;
}

export function SponsorDashboardPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const target = document.querySelector(hash);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hash]);

  return (
    <div className="space-y-6">
      <SectionReveal>
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Sponsor workspace</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {sponsorProfile.initials}
              </span>
              <div>
                <p className="text-sm text-muted-foreground">{timeOfDayGreeting()},</p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Welcome back, {sponsorProfile.greetingName}
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Thank you for supporting our community initiatives.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Sponsor level:</span>{" "}
                <span className="font-medium text-foreground">{sponsorProfile.sponsorLevel} Sponsor</span>
              </p>
              <p>
                <span className="text-muted-foreground">Member since:</span>{" "}
                <span className="font-medium text-foreground">{sponsorProfile.memberSince}</span>
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button to="#sponsored-campaigns">
              <HeartHandshake className="mr-2 size-4" />
              View Sponsored Campaigns
            </Button>
            <Button to="#sponsor-campaign" variant="outline">
              <HandCoins className="mr-2 size-4" />
              Sponsor New Campaign
            </Button>
          </div>
        </header>
      </SectionReveal>

      <SectionReveal delay={0.05}>
        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {sponsorStatistics.map((stat) => {
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
        </div>
      </SectionReveal>

      <SectionReveal delay={0.08}>
        <section id="sponsored-campaigns" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Sponsored campaigns</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Campaigns your organisation currently supports.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {sponsoredCampaigns.map((campaign) => (
              <SponsoredCampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.1}>
        <section id="sponsorship-requests" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Sponsorship requests</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Opportunities from the foundation looking for organisational partners.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {sponsorshipRequests.map((request) => (
              <SponsorshipRequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.12}>
        <section id="sponsor-campaign" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Sponsor a campaign</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose an open TMF campaign to support with funding or resources.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaignsToSponsor.map((campaign) => (
              <SponsorCampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.14}>
        <section id="sponsorship-history" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Sponsorship history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Previous sponsorships and the outcomes they helped deliver.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {sponsorshipHistory.map((item) => (
              <SponsorshipHistoryCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.16}>
        <section id="community-impact" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Community impact</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The difference your sponsorship contributions have made.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
            {communityImpactMetrics.map((metric) => {
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
                    <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                      {metric.value}
                    </p>
                  </CardContent>
                </DashboardCard>
              );
            })}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.18}>
        <div className="grid gap-px bg-border lg:grid-cols-2">
          <DashboardCard id="recent-activity" className="scroll-mt-24">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Your latest sponsorship actions and updates.</CardDescription>
            </CardHeader>
            <CardContent>
              {sponsorActivities.map((activity) => (
                <RecentActivityCard
                  key={activity.id}
                  title={activity.title}
                  description={activity.description}
                  timestamp={activity.timestamp}
                  icon={activity.icon}
                />
              ))}
            </CardContent>
          </DashboardCard>

          <DashboardCard id="organisation-profile" className="scroll-mt-24">
            <CardHeader>
              <CardTitle>Organisation profile</CardTitle>
              <CardDescription>Your sponsor organisation details on file with TMF.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Organisation Name", sponsorProfile.organisationName],
                  ["Representative", sponsorProfile.representative],
                  ["Email Address", sponsorProfile.email],
                  ["Phone Number", sponsorProfile.phone],
                  ["Sponsor Level", `${sponsorProfile.sponsorLevel} Sponsor`],
                  ["Member Since", sponsorProfile.memberSince],
                  ["Business Address", sponsorProfile.businessAddress],
                ].map(([label, value]) => (
                  <div key={label} className={label === "Business Address" ? "sm:col-span-2" : undefined}>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="mt-1 font-medium text-foreground">{value}</p>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-5"
                onClick={() =>
                  toast.message("Profile editing coming soon", {
                    description: "Organisation profile updates will be available in a later update.",
                  })
                }
              >
                Edit Profile
              </Button>
            </CardContent>
          </DashboardCard>
        </div>
      </SectionReveal>

      <SectionReveal delay={0.2}>
        <div className="grid gap-px bg-border lg:grid-cols-2">
          <DashboardCard id="foundation-updates" className="scroll-mt-24">
            <CardHeader>
              <CardTitle>Foundation updates</CardTitle>
              <CardDescription>Important updates for TMF organisational partners.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {foundationUpdates.map((update) => {
                const Icon = update.icon;
                return (
                  <article
                    key={update.id}
                    className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{update.title}</p>
                        <PriorityBadge priority={update.priority} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{update.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{update.date}</p>
                    </div>
                  </article>
                );
              })}
            </CardContent>
          </DashboardCard>

          <DashboardCard id="appreciation" className="scroll-mt-24">
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
                <Button to="#sponsor-campaign" size="sm">
                  <HandCoins className="mr-2 size-4" />
                  Sponsor Another Campaign
                </Button>
                <Button to="#sponsored-campaigns" variant="outline" size="sm">
                  <HeartHandshake className="mr-2 size-4" />
                  Review Your Campaigns
                </Button>
              </div>
            </CardContent>
          </DashboardCard>
        </div>
      </SectionReveal>

      <SectionReveal delay={0.22}>
        <section id="quick-actions" className="scroll-mt-24 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Quick actions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Jump into common sponsorship workflows.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </SectionReveal>
    </div>
  );
}
