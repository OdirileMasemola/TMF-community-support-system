import { ArrowRight, ClipboardList, HandHeart, HeartHandshake, MessageCircle } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  assistanceRequests,
  assistanceStatusOverview,
  assistanceTimeline,
  beneficiaryProfile,
  beneficiaryQuickActions,
  beneficiaryStatistics,
  foundationAnnouncements,
  recentUpdates,
  supportProgrammes,
  upcomingSchedules,
  type AssistancePriority,
  type AssistanceRequestStatus,
} from "@/data/beneficiaryDashboardData";
import { cn } from "@/lib/utils";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function PriorityBadge({ priority }: { priority: AssistancePriority }) {
  const tone =
    priority === "High"
      ? "bg-destructive/10 text-destructive"
      : priority === "Medium"
        ? "bg-secondary text-secondary-foreground"
        : "bg-primary/10 text-primary";

  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>{priority}</span>;
}

function AssistanceStatusBadge({ status }: { status: AssistanceRequestStatus | "Info" }) {
  const tone =
    status === "Approved" || status === "Completed"
      ? "bg-primary/10 text-primary"
      : status === "Submitted" || status === "Under Review" || status === "Info"
        ? "bg-secondary text-secondary-foreground"
        : "bg-destructive/10 text-destructive";

  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>{status}</span>;
}

export function BeneficiaryDashboardPage() {
  const featuredProgrammes = supportProgrammes.filter((programme) => programme.status !== "Closed").slice(0, 3);
  const featuredUpdates = recentUpdates.slice(0, 3);
  const featuredAnnouncements = foundationAnnouncements.slice(0, 3);
  const featuredSchedules = upcomingSchedules.slice(0, 2);
  const firstName = beneficiaryProfile.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Beneficiary workspace</p>
          <p className="mt-2 text-sm font-medium text-muted-foreground">{getGreeting()}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              {beneficiaryProfile.initials}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Welcome back, {firstName}
            </h1>
          </div>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            We&apos;re here to support you throughout your assistance journey.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Member Since:</span>{" "}
              <span className="font-medium text-foreground">{beneficiaryProfile.memberSince}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Total Requests:</span>{" "}
              <span className="font-medium text-foreground">{beneficiaryProfile.totalRequests}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Residential Area:</span>{" "}
              <span className="font-medium text-foreground">{beneficiaryProfile.residentialArea}</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button to="/beneficiary/request">
            <HandHeart className="mr-2 size-4" />
            Request Assistance
          </Button>
          <Button to="/beneficiary/requests" variant="outline">
            <ClipboardList className="mr-2 size-4" />
            View My Requests
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
        {beneficiaryStatistics.map((stat) => {
          const Icon = stat.icon;
          return (
            <DashboardCard key={stat.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
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

        <DashboardCard className="col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Assistance status overview</CardTitle>
            <CardDescription>A quick view of your requests across each stage.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {assistanceStatusOverview.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-muted/30 p-4">
                  <AssistanceStatusBadge status={item.status} />
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{item.count}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>My assistance requests</CardTitle>
            <CardDescription>Your recent assistance applications and current status.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 font-semibold">Request ID</th>
                  <th className="pb-3 font-semibold">Assistance Type</th>
                  <th className="pb-3 font-semibold">Date Submitted</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Priority</th>
                  <th className="pb-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assistanceRequests.map((request) => (
                  <tr key={request.id} className="border-b border-border last:border-0">
                    <td className="py-4 font-medium text-foreground">{request.requestId}</td>
                    <td className="py-4 text-muted-foreground">{request.assistanceType}</td>
                    <td className="py-4 text-muted-foreground">{request.dateSubmitted}</td>
                    <td className="py-4">
                      <AssistanceStatusBadge status={request.status} />
                    </td>
                    <td className="py-4">
                      <PriorityBadge priority={request.priority} />
                    </td>
                    <td className="py-4">
                      <Button variant="ghost" size="sm" className="px-0">
                        View Details
                        <ArrowRight className="ml-1.5 size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button to="/beneficiary/requests" variant="ghost" size="sm" className="mt-4">
              View all requests
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2">
          <CardHeader>
            <CardTitle>Current support programmes</CardTitle>
            <CardDescription>Programmes you may qualify for right now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {featuredProgrammes.map((programme) => (
              <article key={programme.id} className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                <img
                  src={programme.image}
                  alt=""
                  className="hidden h-20 w-28 shrink-0 rounded-lg object-cover sm:block"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{programme.name}</p>
                    <AdminStatusBadge status={programme.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{programme.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Eligibility: <span className="text-foreground">{programme.eligibility}</span>
                  </p>
                  <Button to="/beneficiary/programmes" variant="ghost" size="sm" className="mt-2 px-0">
                    Learn More
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Button>
                </div>
              </article>
            ))}
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2">
          <CardHeader>
            <CardTitle>Recent updates</CardTitle>
            <CardDescription>Latest activity on your assistance journey.</CardDescription>
          </CardHeader>
          <CardContent>
            {featuredUpdates.map((update) => (
              <RecentActivityCard
                key={update.id}
                title={update.title}
                description={update.description}
                timestamp={update.timestamp}
                icon={update.icon}
              />
            ))}
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2">
          <CardHeader>
            <CardTitle>Upcoming assistance schedule</CardTitle>
            <CardDescription>Collection dates and appointments to keep in mind.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {featuredSchedules.map((schedule) => (
              <article key={schedule.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{schedule.programme}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{schedule.location}</p>
                  </div>
                  <AdminStatusBadge status={schedule.status} />
                </div>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <p>
                    Date: <span className="text-foreground">{schedule.collectionDate}</span>
                  </p>
                  <p>
                    Time: <span className="text-foreground">{schedule.time}</span>
                  </p>
                </div>
                <Button to="/beneficiary/requests" variant="ghost" size="sm" className="mt-3 px-0">
                  View Details
                  <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </article>
            ))}
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2">
          <CardHeader>
            <CardTitle>Assistance timeline</CardTitle>
            <CardDescription>Progress for your Food Support request (REQ-001).</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-0">
              {assistanceTimeline.map((stage, index) => {
                const Icon = stage.icon;
                const isLast = index === assistanceTimeline.length - 1;
                return (
                  <li key={stage.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {!isLast && <span className="absolute left-5 top-10 bottom-0 w-px bg-border" aria-hidden="true" />}
                    <span
                      className={cn(
                        "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-lg",
                        stage.state === "completed"
                          ? "bg-primary text-primary-foreground"
                          : stage.state === "current"
                            ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{stage.title}</p>
                        {stage.state === "current" && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{stage.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{stage.date}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Foundation announcements</CardTitle>
            <CardDescription>Important updates from the Themba Molefe Foundation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {featuredAnnouncements.map((announcement) => (
              <article key={announcement.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-foreground">{announcement.title}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {announcement.category}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{announcement.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{announcement.date}</p>
              </article>
            ))}
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile summary</CardTitle>
            <CardDescription>Your current beneficiary details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Full Name", beneficiaryProfile.name],
                ["Email Address", beneficiaryProfile.email],
                ["Phone Number", beneficiaryProfile.phone],
                ["Residential Area", beneficiaryProfile.residentialArea],
                ["Member Since", beneficiaryProfile.memberSince],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button to="/beneficiary/profile" variant="outline" size="sm">
                Edit Profile
              </Button>
              <Button to="/beneficiary/settings" variant="ghost" size="sm">
                Account Settings
              </Button>
            </div>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>
              If you have questions regarding your application or assistance request, please contact the foundation and a
              team member will assist you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MessageCircle className="size-5" />
            </span>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button to="/beneficiary/help" size="sm">
                Contact Foundation
              </Button>
              <Button to="/beneficiary/help" variant="outline" size="sm">
                View FAQ
              </Button>
            </div>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Together We Build Stronger Communities</CardTitle>
            <CardDescription>
              Thank you for trusting the Themba Molefe Foundation. We remain committed to supporting individuals and
              families through meaningful community programmes and assistance initiatives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HeartHandshake className="size-5" />
            </span>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button to="/beneficiary/request" size="sm">
                <HandHeart className="mr-2 size-4" />
                Request Assistance
              </Button>
              <Button to="/beneficiary/programmes" variant="outline" size="sm">
                Explore Campaigns
              </Button>
            </div>
          </CardContent>
        </DashboardCard>
      </div>

      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-foreground md:text-2xl">Quick actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Common beneficiary actions in one place.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {beneficiaryQuickActions.slice(0, 5).map((action) => (
            <QuickActionCard key={action.id} {...action} />
          ))}
        </div>
      </section>
    </div>
  );
}
