import {
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  HandCoins,
  HeartHandshake,
  LockKeyhole,
  Mail,
  Package,
  Phone,
  Settings2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/errors";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { SponsoredCampaignCard } from "@/components/dashboard/SponsoredCampaignCard";
import { SponsorCampaignCard } from "@/components/dashboard/SponsorCampaignCard";
import { SponsorshipHistoryCard } from "@/components/dashboard/SponsorshipHistoryCard";
import { SponsorshipRequestCard } from "@/components/dashboard/SponsorshipRequestCard";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { ProfilePictureEditor } from "@/components/shared/ProfilePictureEditor";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type {
  CampaignStatus,
  CampaignToSponsor,
  RequestPriority,
  SponsoredCampaign,
  SponsorshipHistoryItem,
  SponsorshipHistoryStatus,
  SponsorshipRequest,
} from "@/data/sponsorDashboardData";
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
  notificationIsUnread,
} from "@/lib/display";
import { cn } from "@/lib/utils";
import { getSupabaseClientOrNull, isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchCampaigns } from "@/services/campaigns";
import { updateProfile, type SponsorProfile } from "@/services/profiles";
import {
  createSponsorship,
  createSponsorshipResponse,
  fetchOpenSponsorshipRequests,
  fetchSponsorResponses,
  fetchSponsorSponsorships,
  type SponsorshipWithCampaign,
} from "@/services/sponsorships";

function mapUiCampaignStatus(status: string | null | undefined): CampaignStatus {
  const label = campaignStatusLabel(status ?? "closed");
  if (label === "Active") return "Active";
  if (label === "Draft") return "Upcoming";
  return "Completed";
}

function mapHistoryStatus(row: SponsorshipWithCampaign): SponsorshipHistoryStatus {
  if (row.status === "failed" || row.status === "cancelled") return "Closed";
  if (row.campaigns?.status === "active" || row.status === "pending") return "Active";
  return "Completed";
}

function mapPriority(priority: string | null | undefined): RequestPriority {
  const label = formatStatusLabel(priority);
  if (label === "High" || label === "Medium") return label;
  return "Normal";
}

function toSponsoredCampaign(row: SponsorshipWithCampaign): SponsoredCampaign {
  const campaign = row.campaigns;
  return {
    id: row.id,
    title: campaign?.title ?? "Campaign",
    category: campaign?.category ?? "General",
    status: mapUiCampaignStatus(campaign?.status),
    supportAmount: formatCurrency(row.amount),
    progress: campaignProgress(campaign?.amount_raised, campaign?.funding_goal),
    startDate: formatShortDate(campaign?.start_date),
    endDate: formatShortDate(campaign?.end_date),
    image: resolveCampaignImage(campaign?.image_url, campaign?.title, campaign?.category),
  };
}

function toHistoryItem(row: SponsorshipWithCampaign): SponsorshipHistoryItem {
  return {
    id: row.id,
    campaign: row.campaigns?.title ?? "Campaign",
    contribution: formatCurrency(row.amount),
    date: formatShortDate(row.sponsorship_date),
    status: mapHistoryStatus(row),
    impactSummary: `${formatStatusLabel(row.sponsorship_type ?? row.status)} sponsorship for ${
      row.campaigns?.title ?? "this campaign"
    }.`,
  };
}

function parseAmountInput(raw: string | null): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d.]/g, "");
  const amount = Number(cleaned);
  if (!cleaned || Number.isNaN(amount) || amount <= 0) return null;
  return amount;
}

export function SponsorCampaignsPage() {
  const { roleProfileId, isLoading: roleLoading } = useRoleProfile();

  const query = useQuery({
    queryKey: ["sponsor-sponsorships", roleProfileId],
    enabled: Boolean(isSupabaseConfigured() && roleProfileId),
    queryFn: () => fetchSponsorSponsorships(roleProfileId!),
  });

  const campaigns = (query.data ?? []).map(toSponsoredCampaign);

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
      <DataState
        isLoading={roleLoading || query.isLoading}
        isError={query.isError}
        isEmpty={campaigns.length === 0}
        emptyMessage="You have not sponsored any campaigns yet."
        loadingMessage="Loading sponsored campaigns..."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((campaign) => (
            <SponsoredCampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </DataState>
    </AdminPageShell>
  );
}

export function SponsorSponsorshipsPage() {
  const queryClient = useQueryClient();
  const { roleProfile, roleProfileId, isLoading: roleLoading } = useRoleProfile();
  const sponsorProfile = (roleProfile as SponsorProfile | null) ?? null;

  const sponsorshipsQuery = useQuery({
    queryKey: ["sponsor-sponsorships", roleProfileId],
    enabled: Boolean(isSupabaseConfigured() && roleProfileId),
    queryFn: () => fetchSponsorSponsorships(roleProfileId!),
  });

  const campaignsQuery = useQuery({
    queryKey: ["public-active-campaigns"],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchCampaigns({ publicOnly: true, status: "active" }),
  });

  const sponsoredCampaignIds = useMemo(() => {
    return new Set((sponsorshipsQuery.data ?? []).map((row) => row.campaign_id).filter(Boolean));
  }, [sponsorshipsQuery.data]);

  const openCampaigns: CampaignToSponsor[] = useMemo(() => {
    return (campaignsQuery.data ?? [])
      .filter((campaign) => !sponsoredCampaignIds.has(campaign.id))
      .map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        category: campaign.category ?? "General",
        description: campaign.description,
        fundingGoal: formatCurrency(campaign.funding_goal),
        image: resolveCampaignImage(campaign.image_url, campaign.title, campaign.category),
      }));
  }, [campaignsQuery.data, sponsoredCampaignIds]);

  const sponsorMutation = useMutation({
    mutationFn: async (campaign: CampaignToSponsor) => {
      if (!roleProfileId) throw new Error("Sponsor profile is not ready yet.");
      const raw = window.prompt(`Enter sponsorship amount (ZAR) for ${campaign.title}:`, "5000");
      const amount = parseAmountInput(raw);
      if (amount == null) throw new Error("Please enter a valid amount greater than zero.");

      return createSponsorship({
        sponsor_id: roleProfileId,
        campaign_id: campaign.id,
        amount,
        sponsorship_type: sponsorProfile?.sponsorship_type ?? "financial",
        status: "pending",
      });
    },
    onSuccess: async () => {
      toast.success("Sponsorship submitted", {
        description: "Thank you. Your sponsorship has been recorded and is pending confirmation.",
      });
      await queryClient.invalidateQueries({ queryKey: ["sponsor-sponsorships", roleProfileId] });
    },
    onError: () => {
      toast.error(toUserMessage("Could not create sponsorship."));
    },
  });

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
      <DataState
        isLoading={roleLoading || sponsorshipsQuery.isLoading || campaignsQuery.isLoading}
        isError={sponsorshipsQuery.isError || campaignsQuery.isError}
        isEmpty={openCampaigns.length === 0}
        emptyMessage="There are no open campaigns available to sponsor right now."
        loadingMessage="Loading campaigns..."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {openCampaigns.map((campaign) => (
            <SponsorCampaignCard
              key={campaign.id}
              campaign={campaign}
              onSponsor={(item) => sponsorMutation.mutate(item)}
              isSponsoring={sponsorMutation.isPending && sponsorMutation.variables?.id === campaign.id}
            />
          ))}
        </div>
      </DataState>
    </AdminPageShell>
  );
}

export function SponsorRequestsPage() {
  const queryClient = useQueryClient();
  const { roleProfileId, isLoading: roleLoading } = useRoleProfile();

  const requestsQuery = useQuery({
    queryKey: ["open-sponsorship-requests"],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchOpenSponsorshipRequests(),
  });

  const responsesQuery = useQuery({
    queryKey: ["sponsor-responses", roleProfileId],
    enabled: Boolean(isSupabaseConfigured() && roleProfileId),
    queryFn: () => fetchSponsorResponses(roleProfileId!),
  });

  const respondedRequestIds = useMemo(() => {
    return new Set((responsesQuery.data ?? []).map((row) => row.request_id));
  }, [responsesQuery.data]);

  const requests: SponsorshipRequest[] = useMemo(() => {
    return (requestsQuery.data ?? []).map((request) => ({
      id: request.id,
      campaign: request.title || request.campaigns?.title || "Sponsorship request",
      requestedSupport: request.requested_support,
      category: request.category ?? "General",
      priority: mapPriority(request.priority),
      deadline: formatShortDate(request.deadline),
      estimatedImpact: request.estimated_impact ?? "—",
      icon: ClipboardList,
    }));
  }, [requestsQuery.data]);

  const respondMutation = useMutation({
    mutationFn: async (request: SponsorshipRequest) => {
      if (!roleProfileId) throw new Error("Sponsor profile is not ready yet.");
      const notes = window.prompt(`Optional note for "${request.campaign}":`, "We are interested in supporting this request.") ?? undefined;
      return createSponsorshipResponse({
        request_id: request.id,
        sponsor_id: roleProfileId,
        status: "interested",
        notes: notes?.trim() || null,
      });
    },
    onSuccess: async () => {
      toast.success("Interest submitted", {
        description: "The foundation team will follow up on your response.",
      });
      await queryClient.invalidateQueries({ queryKey: ["sponsor-responses", roleProfileId] });
    },
    onError: () => {
      toast.error(toUserMessage("Could not submit your response."));
    },
  });

  return (
    <AdminPageShell
      label="Sponsorship"
      title="Sponsorship requests"
      description="Opportunities from the foundation looking for organisational partners."
    >
      <DataState
        isLoading={roleLoading || requestsQuery.isLoading || responsesQuery.isLoading}
        isError={requestsQuery.isError || responsesQuery.isError}
        isEmpty={requests.length === 0}
        emptyMessage="No open sponsorship requests at the moment."
        loadingMessage="Loading sponsorship requests..."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {requests.map((request) => (
            <SponsorshipRequestCard
              key={request.id}
              request={request}
              hasResponded={respondedRequestIds.has(request.id)}
              isResponding={respondMutation.isPending && respondMutation.variables?.id === request.id}
              onRespond={(item) => respondMutation.mutate(item)}
            />
          ))}
        </div>
      </DataState>
    </AdminPageShell>
  );
}

export function SponsorHistoryPage() {
  const { roleProfileId, isLoading: roleLoading } = useRoleProfile();

  const query = useQuery({
    queryKey: ["sponsor-sponsorships", roleProfileId],
    enabled: Boolean(isSupabaseConfigured() && roleProfileId),
    queryFn: () => fetchSponsorSponsorships(roleProfileId!),
  });

  const history = (query.data ?? []).map(toHistoryItem);

  return (
    <AdminPageShell
      label="Sponsorship"
      title="Sponsorship history"
      description="Previous sponsorships and the outcomes they helped deliver."
    >
      <DataState
        isLoading={roleLoading || query.isLoading}
        isError={query.isError}
        isEmpty={history.length === 0}
        emptyMessage="No sponsorship history yet."
        loadingMessage="Loading sponsorship history..."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {history.map((item) => (
            <SponsorshipHistoryCard key={item.id} item={item} />
          ))}
        </div>
      </DataState>
    </AdminPageShell>
  );
}

export function SponsorImpactPage() {
  const { roleProfileId, isLoading: roleLoading } = useRoleProfile();

  const query = useQuery({
    queryKey: ["sponsor-sponsorships", roleProfileId],
    enabled: Boolean(isSupabaseConfigured() && roleProfileId),
    queryFn: () => fetchSponsorSponsorships(roleProfileId!),
  });

  const sponsorships = query.data ?? [];
  const totalAmount = sponsorships.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const uniqueCampaigns = new Set(sponsorships.map((row) => row.campaign_id).filter(Boolean)).size;
  const activeCampaigns = new Set(
    sponsorships
      .filter((row) => row.campaigns?.status === "active")
      .map((row) => row.campaign_id)
      .filter(Boolean),
  ).size;
  const successfulCount = sponsorships.filter((row) => row.status === "successful").length;

  const metrics = [
    { id: "sponsorships", label: "Sponsorships Made", value: String(sponsorships.length), icon: HeartHandshake },
    { id: "contributed", label: "Total Contributed", value: formatCurrency(totalAmount), icon: Package },
    { id: "campaigns", label: "Campaigns Supported", value: String(uniqueCampaigns), icon: HandCoins },
    {
      id: "confirmed",
      label: "Confirmed Sponsorships",
      value: String(successfulCount || activeCampaigns),
      icon: CheckCircle2,
    },
  ];

  return (
    <AdminPageShell
      label="Sponsorship"
      title="Community impact"
      description="The difference your sponsorship contributions have made."
    >
      <DataState
        isLoading={roleLoading || query.isLoading}
        isError={query.isError}
        loadingMessage="Loading impact metrics..."
      >
        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {metrics.map((metric) => {
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
      </DataState>
    </AdminPageShell>
  );
}

export function SponsorNotificationsPage() {
  const { notifications, isLoading, isError, markAllRead, markRead } = useNotifications();

  return (
    <AdminPageShell
      label="Your account"
      title="Notifications"
      description="Stay up to date with sponsorship opportunities and foundation updates."
      actions={
        <Button
          type="button"
          variant="outline"
          disabled={markAllRead.isPending || notifications.every((item) => !notificationIsUnread(item.status))}
          onClick={() =>
            markAllRead.mutate(undefined, {
              onSuccess: () => toast.success("All notifications marked as read"),
              onError: () => toast.error("Could not update notifications"),
            })
          }
        >
          Mark all read
        </Button>
      }
    >
      <DashboardCard>
        <CardContent>
          <DataState
            isLoading={isLoading}
            isError={isError}
            isEmpty={notifications.length === 0}
            emptyMessage="No notifications yet."
            loadingMessage="Loading notifications..."
          >
            <ul className="divide-y divide-border">
              {notifications.map((notification) => {
                const unread = notificationIsUnread(notification.status);
                return (
                  <li
                    key={notification.id}
                    className="flex cursor-pointer items-start gap-4 py-5 first:pt-0 last:pb-0"
                    onClick={() => {
                      if (unread) markRead.mutate(notification.id);
                    }}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                      <Bell className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn("font-medium text-foreground", unread && "text-primary")}>
                          {notification.title ?? formatStatusLabel(notification.notification_type)}
                        </p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {formatStatusLabel(notification.notification_type)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatRelativeTime(notification.notification_date)}
                      </p>
                    </div>
                    {unread && <span className="mt-2 size-2 rounded-full bg-primary" aria-label="Unread" />}
                  </li>
                );
              })}
            </ul>
          </DataState>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}

function useSponsorAccountForm() {
  const queryClient = useQueryClient();
  const { profile, session } = useAuth();
  const { roleProfile, roleProfileId, isLoading, refetch } = useRoleProfile();
  const sponsorProfile = (roleProfile as SponsorProfile | null) ?? null;

  const [organisationName, setOrganisationName] = useState("");
  const [representative, setRepresentative] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [sponsorshipType, setSponsorshipType] = useState("");

  useEffect(() => {
    setOrganisationName(sponsorProfile?.organisation_name ?? "");
    setRepresentative(sponsorProfile?.representative_name ?? profile?.full_name ?? "");
    setEmail(profile?.email ?? "");
    setPhone(profile?.phone_number ?? "");
    setBusinessAddress(sponsorProfile?.business_address ?? "");
    setSponsorshipType(sponsorProfile?.sponsorship_type ?? "");
  }, [sponsorProfile, profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const userId = session?.user.id;
      if (!userId || !roleProfileId) throw new Error("Your account is not ready yet.");

      const client = getSupabaseClientOrNull();
      if (!client) throw new Error("Supabase is not configured.");

      await updateProfile(userId, {
        full_name: representative.trim() || profile?.full_name || "Sponsor",
        phone_number: phone.trim() || null,
      });

      const { error } = await client
        .from("sponsor_profiles")
        .update({
          organisation_name: organisationName.trim() || "Organisation",
          representative_name: representative.trim() || null,
          business_address: businessAddress.trim() || null,
          sponsorship_type: sponsorshipType.trim() || null,
        })
        .eq("id", roleProfileId);

      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Profile updated");
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["role-profile"] });
    },
    onError: () => {
      toast.error(toUserMessage("Could not save profile changes."));
    },
  });

  return {
    isLoading,
    sponsorProfile,
    profile,
    organisationName,
    setOrganisationName,
    representative,
    setRepresentative,
    email,
    setEmail,
    phone,
    setPhone,
    businessAddress,
    setBusinessAddress,
    sponsorshipType,
    setSponsorshipType,
    saveMutation,
  };
}

export function SponsorProfilePage() {
  const form = useSponsorAccountForm();
  const organisationName = form.organisationName || form.sponsorProfile?.organisation_name || "Organisation";
  const sponsorLevel = formatStatusLabel(form.sponsorProfile?.sponsor_level) || "Partner";
  const memberSince = formatMonthYear(form.sponsorProfile?.created_at);

  const profileDetails: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "Representative", value: form.representative || "—", icon: UserRound },
    { label: "Email address", value: form.email || "—", icon: Mail },
    { label: "Phone number", value: form.phone || "—", icon: Phone },
    { label: "Member since", value: memberSince, icon: Clock3 },
    { label: "Sponsor level", value: `${sponsorLevel} Sponsor`, icon: CheckCircle2 },
    { label: "Sponsorship type", value: form.sponsorshipType || "—", icon: HandCoins },
    { label: "Business address", value: form.businessAddress || "—", icon: Building2 },
  ];

  return (
    <AdminPageShell
      label="Your account"
      title="Organisation profile"
      description="Your sponsor organisation details on file with TMF."
      actions={
        <Button variant="outline" to="/sponsor/settings">
          <UserRound className="mr-2 size-4" />
          Edit profile
        </Button>
      }
    >
      <DataState isLoading={form.isLoading} loadingMessage="Loading organisation profile...">
        <div className="grid gap-px bg-border lg:grid-cols-[0.75fr_1.25fr]">
          <DashboardCard>
            <CardContent className="flex flex-col items-center py-10 text-center">
              <ProfilePictureEditor />
              <p className="mt-4 text-lg font-semibold text-foreground">{organisationName}</p>
              <p className="mt-1 text-sm text-muted-foreground">{form.representative || "Representative"}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {sponsorLevel} Sponsor
              </span>
              <p className="mt-3 text-sm text-muted-foreground">Member since {memberSince}</p>
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
      </DataState>
    </AdminPageShell>
  );
}

export function SponsorSettingsPage() {
  const form = useSponsorAccountForm();

  return (
    <AdminPageShell
      label="Your account"
      title="Settings"
      description="Manage your organisation details and account preferences."
    >
      <div className="grid gap-px bg-border lg:grid-cols-2">
        <DashboardCard>
          <CardHeader>
            <CardTitle>Account settings</CardTitle>
            <CardDescription>Organisation contact details and profile preferences.</CardDescription>
          </CardHeader>
          <CardContent className="form-grid">
            <DataState isLoading={form.isLoading} loadingMessage="Loading settings...">
              <Input
                label="Organisation name"
                value={form.organisationName}
                onChange={(event) => form.setOrganisationName(event.target.value)}
              />
              <Input
                label="Representative"
                value={form.representative}
                onChange={(event) => form.setRepresentative(event.target.value)}
              />
              <Input label="Email address" value={form.email} disabled />
              <Input
                label="Phone number"
                value={form.phone}
                onChange={(event) => form.setPhone(event.target.value)}
              />
              <Input
                label="Business address"
                value={form.businessAddress}
                onChange={(event) => form.setBusinessAddress(event.target.value)}
              />
              <Input
                label="Sponsorship type"
                value={form.sponsorshipType}
                onChange={(event) => form.setSponsorshipType(event.target.value)}
                placeholder="e.g. financial, in-kind"
              />
              <Button
                type="button"
                disabled={form.saveMutation.isPending}
                onClick={() => form.saveMutation.mutate()}
              >
                {form.saveMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DataState>
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
