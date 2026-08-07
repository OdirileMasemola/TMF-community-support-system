import { ArrowRight, FileUp, Heart, Receipt } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  donationHistory,
  donorActivities,
  donorProfile,
  donorQuickActions,
  donorStatistics,
  proofHistory,
  recommendedCampaigns,
} from "@/data/donorDashboardData";

export function DonorDashboardPage() {
  const recentDonations = donationHistory.slice(0, 3);
  const pendingProofs = proofHistory.filter((proof) => proof.status === "Pending");
  const featuredCampaign = recommendedCampaigns[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Donor workspace</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">{donorProfile.initials}</span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Welcome back, {donorProfile.name.split(" ")[0]}</h1>
          </div>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">See your contributions, verification progress, and ways to continue supporting TMF.</p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button to="/donor/dashboard/donate"><Heart className="mr-2 size-4" />Make a donation</Button>
          <Button to="/donor/dashboard/donations" variant="outline">View history</Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
        {donorStatistics.map((stat) => {
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
                    <td className="py-4"><p className="font-medium text-foreground">{donation.campaign}</p><p className="mt-1 text-xs text-muted-foreground">{donation.reference}</p></td>
                    <td className="py-4 font-medium text-foreground">{donation.amount}</td>
                    <td className="py-4 text-muted-foreground">{donation.date}</td>
                    <td className="py-4"><AdminStatusBadge status={donation.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            {donorActivities.slice(0, 3).map((activity) => <RecentActivityCard key={activity.id} title={activity.title} description="Donor account activity" timestamp={activity.timestamp} icon={activity.icon} />)}
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 lg:col-span-2">
          <CardHeader><CardTitle>Continue your impact</CardTitle><CardDescription>{featuredCampaign.title} is currently accepting donations.</CardDescription></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{featuredCampaign.raised}</span><span>{featuredCampaign.progress}% funded</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${featuredCampaign.progress}%` }} /></div>
            <div className="mt-5 flex gap-3"><Button to="/donor/dashboard/donate" size="sm">Support campaign</Button><Button to="/donor/dashboard/campaigns" variant="outline" size="sm">Browse campaigns</Button></div>
          </CardContent>
        </DashboardCard>
      </div>

      <section>
        <div className="mb-5"><h2 className="text-xl font-bold text-foreground md:text-2xl">Quick actions</h2><p className="mt-1 text-sm text-muted-foreground">Common donor actions in one place.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {donorQuickActions.map((action) => <QuickActionCard key={action.id} {...action} />)}
        </div>
      </section>
    </div>
  );
}
