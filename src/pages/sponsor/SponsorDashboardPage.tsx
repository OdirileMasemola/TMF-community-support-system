import { HandCoins, HeartHandshake } from "lucide-react";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { sponsorProfile, sponsorStatistics } from "@/data/sponsorDashboardData";

function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function SponsorDashboardPage() {
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
          <Button to="/sponsor/dashboard">
            <HeartHandshake className="mr-2 size-4" />
            View Sponsored Campaigns
          </Button>
          <Button to="/sponsor/dashboard" variant="outline">
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
    </div>
  );
}
