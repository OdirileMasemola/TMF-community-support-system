import {
  Building2,
  CheckCircle2,
  Clock3,
  HandCoins,
  LockKeyhole,
  Mail,
  Phone,
  Settings2,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { SponsoredCampaignCard } from "@/components/dashboard/SponsoredCampaignCard";
import { SponsorCampaignCard } from "@/components/dashboard/SponsorCampaignCard";
import { SponsorshipHistoryCard } from "@/components/dashboard/SponsorshipHistoryCard";
import { SponsorshipRequestCard } from "@/components/dashboard/SponsorshipRequestCard";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  campaignsToSponsor,
  communityImpactMetrics,
  sponsoredCampaigns,
  sponsorNotifications,
  sponsorProfile,
  sponsorshipHistory,
  sponsorshipRequests,
} from "@/data/sponsorDashboardData";
import { cn } from "@/lib/utils";

const profileDetails: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Representative", value: sponsorProfile.representative, icon: UserRound },
  { label: "Email address", value: sponsorProfile.email, icon: Mail },
  { label: "Phone number", value: sponsorProfile.phone, icon: Phone },
  { label: "Member since", value: sponsorProfile.memberSince, icon: Clock3 },
  { label: "Sponsor level", value: `${sponsorProfile.sponsorLevel} Sponsor`, icon: CheckCircle2 },
  { label: "Business address", value: sponsorProfile.businessAddress, icon: Building2 },
];

export function SponsorCampaignsPage() {
  return (
    <AdminPageShell
      label="Sponsorship"
      title="Sponsored campaigns"
      description="Campaigns your organisation currently supports."
      actions={
        <Button to="/sponsor/sponsorships">
          <HandCoins className="mr-2 size-4" />
          Sponsor a campaign
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {sponsoredCampaigns.map((campaign) => (
          <SponsoredCampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </AdminPageShell>
  );
}

export function SponsorSponsorshipsPage() {
  return (
    <AdminPageShell
      label="Sponsorship"
      title="Sponsor a campaign"
      description="Choose an open TMF campaign to support with funding or resources."
      actions={
        <Button to="/sponsor/campaigns" variant="outline">
          View sponsored campaigns
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaignsToSponsor.map((campaign) => (
          <SponsorCampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </div>
    </AdminPageShell>
  );
}

export function SponsorRequestsPage() {
  return (
    <AdminPageShell
      label="Sponsorship"
      title="Sponsorship requests"
      description="Opportunities from the foundation looking for organisational partners."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {sponsorshipRequests.map((request) => (
          <SponsorshipRequestCard key={request.id} request={request} />
        ))}
      </div>
    </AdminPageShell>
  );
}

export function SponsorHistoryPage() {
  return (
    <AdminPageShell
      label="Sponsorship"
      title="Sponsorship history"
      description="Previous sponsorships and the outcomes they helped deliver."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {sponsorshipHistory.map((item) => (
          <SponsorshipHistoryCard key={item.id} item={item} />
        ))}
      </div>
    </AdminPageShell>
  );
}

export function SponsorImpactPage() {
  return (
    <AdminPageShell
      label="Sponsorship"
      title="Community impact"
      description="The difference your sponsorship contributions have made."
    >
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
                <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{metric.value}</p>
              </CardContent>
            </DashboardCard>
          );
        })}
      </div>
    </AdminPageShell>
  );
}

export function SponsorNotificationsPage() {
  return (
    <AdminPageShell
      label="Your account"
      title="Notifications"
      description="Stay up to date with sponsorship opportunities and foundation updates."
      actions={<Button variant="outline">Mark all read</Button>}
    >
      <DashboardCard>
        <CardContent>
          <ul className="divide-y divide-border">
            {sponsorNotifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <li key={notification.id} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("font-medium text-foreground", notification.unread && "text-primary")}>
                        {notification.title}
                      </p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {notification.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{notification.timestamp}</p>
                  </div>
                  {notification.unread && <span className="mt-2 size-2 rounded-full bg-primary" aria-label="Unread" />}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}

export function SponsorProfilePage() {
  return (
    <AdminPageShell
      label="Your account"
      title="Organisation profile"
      description="Your sponsor organisation details on file with TMF."
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            toast.message("Profile editing coming soon", {
              description: "Organisation profile updates will be available in a later update.",
            })
          }
        >
          <UserRound className="mr-2 size-4" />
          Edit profile
        </Button>
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[0.75fr_1.25fr]">
        <DashboardCard>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <span className="flex size-20 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
              {sponsorProfile.initials}
            </span>
            <p className="mt-4 text-lg font-semibold text-foreground">{sponsorProfile.organisationName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{sponsorProfile.representative}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {sponsorProfile.sponsorLevel} Sponsor
            </span>
            <p className="mt-3 text-sm text-muted-foreground">Member since {sponsorProfile.memberSince}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>Organisation information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {profileDetails.map(({ label, value, icon: Icon }) => (
              <div key={label} className={label === "Business address" ? "sm:col-span-2" : undefined}>
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Icon className="size-3.5 text-primary" aria-hidden="true" />
                  {label}
                </p>
                <p className="mt-2 font-medium text-foreground">{value}</p>
              </div>
            ))}
          </CardContent>
        </DashboardCard>
      </div>
    </AdminPageShell>
  );
}

export function SponsorSettingsPage() {
  return (
    <AdminPageShell
      label="Your account"
      title="Settings"
      description="Manage your account preferences. Changes are visual placeholders until account settings are connected."
    >
      <div className="grid gap-px bg-border lg:grid-cols-2">
        <DashboardCard>
          <CardHeader>
            <CardTitle>Account settings</CardTitle>
            <CardDescription>Organisation contact details and profile preferences.</CardDescription>
          </CardHeader>
          <CardContent className="form-grid">
            <Input label="Organisation name" defaultValue={sponsorProfile.organisationName} />
            <Input label="Representative" defaultValue={sponsorProfile.representative} />
            <Input label="Email address" defaultValue={sponsorProfile.email} />
            <Input label="Phone number" defaultValue={sponsorProfile.phone} />
            <Button type="button">Save changes</Button>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose the updates you would like to receive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Sponsorship opportunities", "Campaign progress reports", "Foundation announcements"].map((label) => (
              <label key={label} className="flex items-center justify-between gap-4 text-sm font-medium text-foreground">
                <span>{label}</span>
                <input type="checkbox" defaultChecked className="size-4 accent-primary" />
              </label>
            ))}
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Use the theme selector in the header to switch between light and dark themes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Settings2 className="size-5 text-primary" aria-hidden="true" />
              Your selected theme is applied across the sponsor portal.
            </div>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Password and account security options will be available when account management is connected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline">
              <LockKeyhole className="mr-2 size-4" />
              Manage account security
            </Button>
          </CardContent>
        </DashboardCard>
      </div>
    </AdminPageShell>
  );
}
