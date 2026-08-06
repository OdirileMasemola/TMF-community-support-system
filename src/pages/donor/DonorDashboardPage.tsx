import {
  ArrowRight,
  Download,
  Eye,
  Heart,
  Mail,
  Phone,
  Receipt,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { SectionReveal } from "@/components/ui/SectionReveal";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import {
  donationHistory,
  donorActivities,
  donorImpact,
  donorProfile,
  donorQuickActions,
  donorStatistics,
  foundationUpdates,
  proofHistory,
  recommendedCampaigns,
  updateIcon as Bell,
  type DonationStatus,
} from "@/data/donorDashboardData";
import { cn } from "@/lib/utils";

const statusStyles: Record<DonationStatus, string> = {
  Verified: "border-primary/25 bg-primary/10 text-primary",
  Pending: "border-secondary/60 bg-secondary/50 text-secondary-foreground",
  Rejected: "border-destructive/25 bg-destructive/10 text-destructive",
};

function StatusBadge({ status }: { status: DonationStatus }) {
  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", statusStyles[status])}>{status}</span>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>}
      <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground md:text-2xl">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function DonorDashboardPage() {
  return (
    <div className="space-y-8 pb-4">
      <SectionReveal>
        <Card className="overflow-hidden bg-card/70 p-0 backdrop-blur-xl">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
                {donorProfile.initials}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Good afternoon,</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">Welcome back, {donorProfile.name.split(" ")[0]}</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Thank you for supporting the Themba Molefe Foundation. Your generosity continues to make a meaningful difference.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button to="/donate"><Heart className="mr-2 size-4" />Make another donation</Button>
              <Button to="#donation-history" variant="outline">Donation history</Button>
            </div>
          </div>
          <div className="grid border-t border-border bg-muted/30 sm:grid-cols-2">
            <div className="px-6 py-4 md:px-8">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Member since</p>
              <p className="mt-1 font-semibold text-foreground">{donorProfile.memberSince}</p>
            </div>
            <div className="border-t border-border px-6 py-4 sm:border-l sm:border-t-0 md:px-8">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total donated</p>
              <p className="mt-1 font-semibold text-foreground">{donorProfile.totalAmount}</p>
            </div>
          </div>
        </Card>
      </SectionReveal>

      <SectionReveal delay={0.05}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {donorStatistics.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.id} className="bg-card/70 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{stat.value}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{stat.detail}</p>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
                </div>
              </Card>
            );
          })}
        </div>
      </SectionReveal>

      <SectionReveal delay={0.08}>
        <section id="donation-history">
          <SectionHeading eyebrow="Your contributions" title="Donation history" description="Track every contribution and its verification status." />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {donationHistory.map((donation) => (
              <Card key={donation.id} className="bg-card/70 backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{donation.type}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{donation.campaign}</p>
                  </div>
                  <StatusBadge status={donation.status} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
                  <div><p className="text-xs text-muted-foreground">Amount</p><p className="mt-1 font-semibold text-foreground">{donation.amount}</p></div>
                  <div><p className="text-xs text-muted-foreground">Payment date</p><p className="mt-1 font-medium text-foreground">{donation.date}</p></div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="truncate text-xs text-muted-foreground">Ref: {donation.reference}</p>
                  <Button size="sm" variant="ghost">View details<ArrowRight className="ml-1.5 size-3.5" /></Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.1}>
        <section id="proof-history">
          <SectionHeading eyebrow="Payment records" title="Proof of payment history" description="All submitted proof documents are shown here for your reference." />
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {proofHistory.map((proof) => (
              <Card key={proof.id} className="bg-card/70 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Receipt className="size-5" /></span>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{proof.fileName}</p><p className="mt-1 text-xs text-muted-foreground">Submitted {proof.submittedAt}</p></div>
                </div>
                <div className="mt-5 flex items-center justify-between"><p className="font-semibold text-foreground">{proof.amount}</p><StatusBadge status={proof.status} /></div>
                <p className="mt-4 min-h-10 text-sm leading-5 text-muted-foreground">{proof.comment}</p>
                <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" className="flex-1"><Eye className="mr-1.5 size-3.5" />View proof</Button><Button size="sm" variant="ghost" className="flex-1"><Download className="mr-1.5 size-3.5" />Download</Button></div>
              </Card>
            ))}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.1}>
        <section>
          <SectionHeading eyebrow="Your impact" title="Every contribution reaches further" description="A snapshot of the change your donations have helped make possible." />
          <div className="mt-5 grid gap-4 grid-cols-2 lg:grid-cols-4">
            {donorImpact.map((impact) => {
              const Icon = impact.icon;
              return <Card key={impact.id} className="bg-card/70 text-center backdrop-blur-xl"><span className="mx-auto flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span><p className="mt-4 text-2xl font-bold text-foreground">{impact.value}</p><p className="mt-1 text-sm text-muted-foreground">{impact.label}</p></Card>;
            })}
          </div>
        </section>
      </SectionReveal>

      <SectionReveal delay={0.12}>
        <section>
          <SectionHeading eyebrow="Continue your support" title="Recommended campaigns" description="Discover causes currently accepting donations." />
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {recommendedCampaigns.map((campaign) => (
              <Card key={campaign.id} className="overflow-hidden bg-card/70 p-0 backdrop-blur-xl">
                <img src={campaign.image} alt="" className="h-36 w-full object-cover" />
                <CardContent>
                  <p className="text-xs font-medium text-primary">{campaign.category}</p><CardTitle className="mt-2">{campaign.title}</CardTitle>
                  <CardDescription className="mt-2 line-clamp-2 leading-5">{campaign.description}</CardDescription>
                  <div className="mt-4"><div className="flex justify-between text-xs text-muted-foreground"><span>{campaign.raised}</span><span>{campaign.progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${campaign.progress}%` }} /></div></div>
                  <Button to="/donate" size="sm" className="mt-5 w-full">Donate now</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </SectionReveal>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionReveal delay={0.14}>
          <section>
            <SectionHeading eyebrow="From the foundation" title="Foundation updates" />
            <Card className="mt-5 bg-card/70 backdrop-blur-xl"><CardContent className="space-y-4 p-0">
              {foundationUpdates.map((update, index) => (
                <div key={update.id} className={cn("flex gap-3 p-5", index !== foundationUpdates.length - 1 && "border-b border-border")}>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Bell className="size-4" /></span>
                  <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{update.title}</p><span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{update.priority}</span></div><p className="mt-1 text-sm leading-5 text-muted-foreground">{update.description}</p><p className="mt-2 text-xs text-muted-foreground">{update.date}</p></div>
                </div>
              ))}
            </CardContent></Card>
          </section>
        </SectionReveal>
        <SectionReveal delay={0.16}>
          <section>
            <SectionHeading eyebrow="Your timeline" title="Recent activity" />
            <Card className="mt-5 bg-card/70 backdrop-blur-xl"><CardContent className="p-0">
              {donorActivities.map((activity, index) => {
                const Icon = activity.icon;
                return <div key={activity.id} className={cn("flex gap-3 p-5", index !== donorActivities.length - 1 && "border-b border-border")}><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-primary"><Icon className="size-4" /></span><div><p className="font-medium text-foreground">{activity.title}</p><p className="mt-1 text-xs text-muted-foreground">{activity.timestamp}</p></div></div>;
              })}
            </CardContent></Card>
          </section>
        </SectionReveal>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionReveal delay={0.18}>
          <section>
            <SectionHeading eyebrow="Your details" title="Donor profile" />
            <Card className="mt-5 bg-card/70 backdrop-blur-xl">
              <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">{donorProfile.initials}</span><div><p className="font-semibold text-foreground">{donorProfile.name}</p><p className="text-sm text-muted-foreground">{donorProfile.donorId}</p></div></div>
              <div className="mt-5 space-y-3 border-y border-border py-4 text-sm"><p className="flex items-center gap-2 text-muted-foreground"><Mail className="size-4 text-primary" />{donorProfile.email}</p><p className="flex items-center gap-2 text-muted-foreground"><Phone className="size-4 text-primary" />{donorProfile.phone}</p><p className="flex items-center gap-2 text-muted-foreground"><Heart className="size-4 text-primary" />{donorProfile.preferredDonationType}</p></div>
              <Button variant="outline" className="mt-5 w-full"><UserRound className="mr-2 size-4" />Edit profile</Button>
            </Card>
          </section>
        </SectionReveal>
        <SectionReveal delay={0.2}>
          <section>
            <SectionHeading eyebrow="Make it easy" title="Quick actions" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {donorQuickActions.map((action) => <QuickActionCard key={action.id} {...action} />)}
            </div>
          </section>
        </SectionReveal>
      </div>

      <SectionReveal delay={0.22}>
        <Card className="bg-primary p-6 text-primary-foreground md:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground/75">Thank you</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Thank you for making a difference.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-primary-foreground/80">Your generosity helps the Themba Molefe Foundation provide assistance, support community campaigns, and improve the lives of vulnerable individuals and families.</p></div><div className="flex gap-3"><Button to="/donate" variant="secondary">Donate again</Button><Button to="/campaigns" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">Browse campaigns</Button></div></div>
        </Card>
      </SectionReveal>
    </div>
  );
}
