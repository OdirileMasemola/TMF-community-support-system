import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  FileUp,
  HandCoins,
  Heart,
  HeartHandshake,
  Receipt,
} from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { donorQuickActions } from "@/data/donorDashboardData";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import {
  campaignProgress,
  formatCurrency,
  formatRelativeTime,
  formatShortDate,
  getInitials,
  paymentStatusLabel,
} from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchCampaigns } from "@/services/campaigns";
import { fetchDonorDonations, fetchDonorProofs } from "@/services/donations";

function paymentBadgeStatus(status: string): string {
  if (status === "successful") return "Verified";
  if (status === "pending") return "Pending";
  if (status === "failed" || status === "cancelled") return "Rejected";
  return paymentStatusLabel(status);
}

export function DonorDashboardPage() {
  const { profile } = useAuth();
  const { roleProfileId, isLoading: roleLoading } = useRoleProfile();
  const supabaseReady = isSupabaseConfigured();
  const enabled = Boolean(supabaseReady && roleProfileId);

  const donationsQuery = useQuery({
    queryKey: ["donor-donations", roleProfileId],
    enabled,
    queryFn: () => fetchDonorDonations(roleProfileId!),
  });

  const proofsQuery = useQuery({
    queryKey: ["donor-proofs", roleProfileId],
    enabled,
    queryFn: () => fetchDonorProofs(roleProfileId!),
  });

  const campaignsQuery = useQuery({
    queryKey: ["campaigns", "public"],
    enabled: supabaseReady,
    queryFn: () => fetchCampaigns({ publicOnly: true }),
  });

  const donations = donationsQuery.data ?? [];
  const proofs = proofsQuery.data ?? [];
  const campaigns = campaignsQuery.data ?? [];

  const fullName = profile?.full_name?.trim() || "Donor";
  const firstName = fullName.split(" ")[0] || "Donor";
  const initials = getInitials(fullName);

  const stats = useMemo(() => {
    const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
    const verified = donations.filter((d) => d.status === "successful").length;
    const pending = donations.filter((d) => d.status === "pending").length;
    const uniqueCampaigns = new Set(donations.map((d) => d.campaign_id).filter(Boolean)).size;

    return [
      {
        id: "total",
        title: "Total Donations",
        value: String(donations.length),
        detail: `${formatCurrency(totalAmount)} contributed`,
        icon: HandCoins,
      },
      {
        id: "verified",
        title: "Verified Donations",
        value: String(verified),
        detail: "Confirmed by TMF",
        icon: BadgeCheck,
      },
      {
        id: "pending",
        title: "Pending Verification",
        value: String(pending),
        detail: "Proofs under review",
        icon: Clock3,
      },
      {
        id: "campaigns",
        title: "Campaigns Supported",
        value: String(uniqueCampaigns),
        detail: "Making a local impact",
        icon: HeartHandshake,
      },
    ];
  }, [donations]);

  const recentDonations = donations.slice(0, 3);
  const pendingProofs = proofs.filter((proof) => proof.verification_status === "pending");
  const featuredCampaign = campaigns[0];
  const featuredProgress = featuredCampaign
    ? campaignProgress(featuredCampaign.amount_raised, featuredCampaign.funding_goal)
    : 0;

  const activities = useMemo(() => {
    const donationActivities = donations.slice(0, 3).map((donation) => ({
      id: `donation-${donation.id}`,
      title: donation.campaigns?.title
        ? `Supported ${donation.campaigns.title}`
        : `Donation of ${formatCurrency(donation.amount)}`,
      timestamp: formatRelativeTime(donation.donation_date),
      icon: donation.status === "successful" ? BadgeCheck : HeartHandshake,
      sortKey: donation.donation_date,
    }));

    const proofActivities = proofs.slice(0, 3).map((proof) => ({
      id: `proof-${proof.id}`,
      title: proof.donations?.campaigns?.title
        ? `Submitted proof for ${proof.donations.campaigns.title}`
        : "Submitted proof of payment",
      timestamp: formatRelativeTime(proof.uploaded_at),
      icon: Receipt,
      sortKey: proof.uploaded_at,
    }));

    return [...donationActivities, ...proofActivities]
      .sort((a, b) => new Date(b.sortKey).getTime() - new Date(a.sortKey).getTime())
      .slice(0, 3);
  }, [donations, proofs]);

  const isLoading = roleLoading || (enabled && (donationsQuery.isLoading || proofsQuery.isLoading)) || (supabaseReady && campaignsQuery.isLoading);
  const isError = donationsQuery.isError || proofsQuery.isError || campaignsQuery.isError;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Donor workspace</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">{initials}</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Welcome back, {firstName}</h1>
          </div>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">See your contributions, verification progress, and ways to continue supporting TMF.</p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button to="/donor/dashboard/donate"><Heart className="mr-2 size-4" />Make a donation</Button>
          <Button to="/donor/dashboard/donations" variant="outline">View history</Button>
        </div>
      </header>

      <DataState
        isLoading={isLoading}
        isError={isError}
        errorMessage="We could not load your donor dashboard right now. Please try again shortly."
        loadingMessage="Loading your donor workspace..."
      >
        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <DashboardCard key={stat.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{stat.detail}</p>
                </CardContent>
              </DashboardCard>
            );
          })}

          <DashboardCard className="col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent donations</CardTitle>
              <CardDescription>Your latest donation activity and verification status.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <DataState isEmpty={recentDonations.length === 0} emptyMessage="No donations yet. Make your first contribution to get started.">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="pb-3 font-semibold">Campaign</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDonations.map((donation) => (
                      <tr key={donation.id} className="border-b border-border last:border-0">
                        <td className="py-4">
                          <p className="font-medium text-foreground">{donation.campaigns?.title ?? "General donation"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{donation.payment_reference ?? donation.receipt_number ?? "—"}</p>
                        </td>
                        <td className="py-4 font-medium text-foreground">{formatCurrency(donation.amount)}</td>
                        <td className="py-4 text-muted-foreground">{formatShortDate(donation.donation_date)}</td>
                        <td className="py-4"><AdminStatusBadge status={paymentBadgeStatus(donation.status)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataState>
              <Button to="/donor/dashboard/donations" variant="ghost" size="sm" className="mt-4">View all donations<ArrowRight className="ml-1.5 size-3.5" /></Button>
            </CardContent>
          </DashboardCard>

          <DashboardCard className="col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Proof of payment</CardTitle>
              <CardDescription>{pendingProofs.length ? `${pendingProofs.length} proof awaiting review` : "All proofs are up to date"}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Receipt className="size-5" /></span>
              <p className="mt-4 text-sm text-muted-foreground">Submit a proof after making an EFT donation so the TMF team can verify it.</p>
              <Button to="/donor/dashboard/proof-of-payment" variant="outline" size="sm" className="mt-5 w-full"><FileUp className="mr-2 size-4" />Manage proofs</Button>
            </CardContent>
          </DashboardCard>

          <DashboardCard className="col-span-2 lg:col-span-2">
            <CardHeader><CardTitle>Recent activity</CardTitle><CardDescription>Your latest donor updates.</CardDescription></CardHeader>
            <CardContent>
              <DataState isEmpty={activities.length === 0} emptyMessage="No recent activity yet.">
                {activities.map((activity) => (
                  <RecentActivityCard key={activity.id} title={activity.title} description="Donor account activity" timestamp={activity.timestamp} icon={activity.icon} />
                ))}
              </DataState>
            </CardContent>
          </DashboardCard>

          <DashboardCard className="col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle>Continue your impact</CardTitle>
              <CardDescription>
                {featuredCampaign
                  ? `${featuredCampaign.title} is currently accepting donations.`
                  : "Browse campaigns currently accepting donations."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {featuredCampaign ? (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(featuredCampaign.amount_raised)} raised</span>
                    <span>{featuredProgress}% funded</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${featuredProgress}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No public campaigns are available right now.</p>
              )}
              <div className="mt-5 flex gap-3">
                <Button to="/donor/dashboard/donate" size="sm">Support campaign</Button>
                <Button to="/donor/dashboard/campaigns" variant="outline" size="sm">Browse campaigns</Button>
              </div>
            </CardContent>
          </DashboardCard>
        </div>
      </DataState>

      <section>
        <div className="mb-5"><h2 className="text-xl font-bold text-foreground md:text-2xl">Quick actions</h2><p className="mt-1 text-sm text-muted-foreground">Common donor actions in one place.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {donorQuickActions.map((action) => <QuickActionCard key={action.id} {...action} />)}
        </div>
      </section>
    </div>
  );
}
