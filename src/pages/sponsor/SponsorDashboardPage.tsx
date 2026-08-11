import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { HandCoins, HeartHandshake } from "lucide-react";
import { SponsoredCampaignCard } from "@/components/dashboard/SponsoredCampaignCard";
import { SponsorshipHistoryCard } from "@/components/dashboard/SponsorshipHistoryCard";
import { SponsorshipRequestCard } from "@/components/dashboard/SponsorshipRequestCard";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  communityImpactMetrics,
  sponsoredCampaigns,
  sponsorProfile,
  sponsorshipHistory,
  sponsorshipRequests,
  sponsorStatistics,
} from "@/data/sponsorDashboardData";

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
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
          <Button to="#sponsorship-requests" variant="outline">
            <HandCoins className="mr-2 size-4" />
            Sponsor New Campaign
          </Button>
        </div>
      </header>

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
    </div>
  );
}
