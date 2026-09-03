import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, ClipboardList, Clock3, FileText, HandHeart, HeartHandshake, MessageCircle } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { beneficiaryQuickActions } from "@/data/beneficiaryDashboardData";
import { useNotifications } from "@/hooks/useNotifications";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import {
  campaignStatusLabel,
  formatMonthYear,
  formatRelativeTime,
  formatShortDate,
  formatStatusLabel,
  getInitials,
  requestStatusLabel,
} from "@/lib/display";
import { cn } from "@/lib/utils";
import {
  fetchBeneficiaryRequests,
  fetchCollectionSchedulesForRequests,
} from "@/services/assistance";
import { fetchCampaigns } from "@/services/campaigns";
import type { BeneficiaryProfile } from "@/services/profiles";
import foodSupportImage from "@/assets/images/campaigns/Food Support Drive.webp";
import type { RequestStatus } from "@/types/database.types";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function PriorityBadge({ priority }: { priority: string }) {
  const label = formatStatusLabel(priority);
  const tone =
    label === "High"
      ? "bg-destructive/10 text-destructive"
      : label === "Medium"
        ? "bg-secondary text-secondary-foreground"
        : "bg-primary/10 text-primary";

  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>{label}</span>;
}

function AssistanceStatusBadge({ status }: { status: string }) {
  const tone =
    status === "Approved" || status === "Completed"
      ? "bg-primary/10 text-primary"
      : status === "Submitted" || status === "Under Review" || status === "Info"
        ? "bg-secondary text-secondary-foreground"
        : "bg-destructive/10 text-destructive";

  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>{status}</span>;
}

const STATUS_ORDER: RequestStatus[] = ["pending", "under_review", "approved", "rejected", "completed"];

export function BeneficiaryDashboardPage() {
  const { profile, roleProfile, roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const beneficiaryRole = roleProfile as BeneficiaryProfile | null;
  const { notifications, isLoading: notificationsLoading, isError: notificationsError } = useNotifications(5);

  const enabled = Boolean(roleProfileId);
  const requestsQuery = useQuery({
    queryKey: ["beneficiary-requests", roleProfileId],
    enabled,
    queryFn: () => fetchBeneficiaryRequests(roleProfileId!),
  });
  const requests = requestsQuery.data ?? [];
  const requestIds = requests.map((item) => item.id);

  const schedulesQuery = useQuery({
    queryKey: ["beneficiary-schedules", roleProfileId, requestIds.join(",")],
    enabled: enabled && requestIds.length > 0,
    queryFn: () => fetchCollectionSchedulesForRequests(requestIds),
  });
  const campaignsQuery = useQuery({
    queryKey: ["campaigns", "public-active"],
    queryFn: () => fetchCampaigns({ publicOnly: true }),
  });

  const schedules = schedulesQuery.data ?? [];
  const campaigns = campaignsQuery.data ?? [];
  const name = profile?.full_name ?? "Beneficiary";
  const firstName = name.split(" ")[0];
  const initials = getInitials(name);
  const memberSince = formatMonthYear(beneficiaryRole?.created_at);

  const statusOverview = STATUS_ORDER.map((status) => ({
    id: status,
    status: requestStatusLabel(status),
    count: requests.filter((item) => item.status === status).length,
  }));

  const statistics = [
    {
      id: "requests",
      title: "Total Requests",
      value: String(requests.length),
      detail: "Submitted to date",
      icon: ClipboardList,
    },
    {
      id: "review",
      title: "Under Review",
      value: String(requests.filter((item) => item.status === "under_review" || item.status === "pending").length),
      detail: "Awaiting foundation response",
      icon: Clock3,
    },
    {
      id: "approved",
      title: "Approved",
      value: String(requests.filter((item) => item.status === "approved").length),
      detail: "Ready for support",
      icon: FileText,
    },
    {
      id: "schedules",
      title: "Collections",
      value: String(schedules.length),
      detail: "Scheduled pickups",
      icon: HeartHandshake,
    },
  ];

  const recentRequests = requests.slice(0, 5);
  const featuredProgrammes = campaigns.slice(0, 3);
  const featuredSchedules = schedules.slice(0, 2);
  const latestRequest = requests[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Beneficiary workspace</p>
          <p className="mt-2 text-sm font-medium text-muted-foreground">{getGreeting()}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              {initials}
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
              <span className="font-medium text-foreground">{memberSince}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Total Requests:</span>{" "}
              <span className="font-medium text-foreground">{requests.length}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Residential Area:</span>{" "}
              <span className="font-medium text-foreground">{beneficiaryRole?.residential_address ?? "—"}</span>
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
        {statistics.map((stat) => {
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
            <DataState
              isLoading={profileLoading || requestsQuery.isLoading}
              isError={requestsQuery.isError}
              isEmpty={requests.length === 0}
              emptyMessage="No assistance requests yet."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {statusOverview.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border bg-muted/30 p-4">
                    <AssistanceStatusBadge status={item.status} />
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{item.count}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.status}</p>
                  </div>
                ))}
              </div>
            </DataState>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>My assistance requests</CardTitle>
            <CardDescription>Your recent assistance applications and current status.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <DataState
              isLoading={profileLoading || requestsQuery.isLoading}
              isError={requestsQuery.isError}
              isEmpty={recentRequests.length === 0}
              emptyMessage="You have not submitted any assistance requests yet."
            >
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
                  {recentRequests.map((request) => (
                    <tr key={request.id} className="border-b border-border last:border-0">
                      <td className="py-4 font-medium text-foreground">
                        REQ-{request.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-4 text-muted-foreground">{request.request_type}</td>
                      <td className="py-4 text-muted-foreground">{formatShortDate(request.request_date)}</td>
                      <td className="py-4">
                        <AssistanceStatusBadge status={requestStatusLabel(request.status)} />
                      </td>
                      <td className="py-4">
                        <PriorityBadge priority={request.priority ?? "medium"} />
                      </td>
                      <td className="py-4">
                        <Button to="/beneficiary/requests" variant="ghost" size="sm" className="px-0">
                          View Details
                          <ArrowRight className="ml-1.5 size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataState>
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
            <DataState
              isLoading={campaignsQuery.isLoading}
              isError={campaignsQuery.isError}
              isEmpty={featuredProgrammes.length === 0}
              emptyMessage="No active programmes available."
            >
              {featuredProgrammes.map((programme) => (
                <article key={programme.id} className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                  <img
                    src={programme.image_url || foodSupportImage}
                    alt=""
                    className="hidden h-20 w-28 shrink-0 rounded-lg object-cover sm:block"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{programme.title}</p>
                      <AdminStatusBadge status={campaignStatusLabel(programme.status)} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{programme.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Location: <span className="text-foreground">{programme.location}</span>
                    </p>
                    <Button to="/beneficiary/programmes" variant="ghost" size="sm" className="mt-2 px-0">
                      Learn More
                      <ArrowRight className="ml-1.5 size-3.5" />
                    </Button>
                  </div>
                </article>
              ))}
            </DataState>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2">
          <CardHeader>
            <CardTitle>Recent updates</CardTitle>
            <CardDescription>Latest activity on your assistance journey.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataState
              isLoading={notificationsLoading}
              isError={notificationsError}
              isEmpty={notifications.length === 0}
              emptyMessage="No recent updates yet."
            >
              {notifications.slice(0, 3).map((update) => (
                <RecentActivityCard
                  key={update.id}
                  title={update.title ?? "Update"}
                  description={update.message}
                  timestamp={formatRelativeTime(update.notification_date)}
                  icon={Bell}
                />
              ))}
            </DataState>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2">
          <CardHeader>
            <CardTitle>Upcoming assistance schedule</CardTitle>
            <CardDescription>Collection dates and appointments to keep in mind.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataState
              isLoading={schedulesQuery.isLoading}
              isError={schedulesQuery.isError}
              isEmpty={featuredSchedules.length === 0}
              emptyMessage="No collection schedules yet."
            >
              {featuredSchedules.map((schedule) => (
                <article key={schedule.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{schedule.programme_name ?? "Assistance collection"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{schedule.location}</p>
                    </div>
                    <AdminStatusBadge status={formatStatusLabel(schedule.status)} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <p>
                      Date: <span className="text-foreground">{formatShortDate(schedule.collection_date)}</span>
                    </p>
                    <p>
                      Time: <span className="text-foreground">{schedule.collection_time ?? "—"}</span>
                    </p>
                  </div>
                  <Button to="/beneficiary/help" variant="ghost" size="sm" className="mt-3 px-0">
                    View Details
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Button>
                </article>
              ))}
            </DataState>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2">
          <CardHeader>
            <CardTitle>Assistance timeline</CardTitle>
            <CardDescription>
              {latestRequest
                ? `Progress for your ${latestRequest.request_type} request.`
                : "Progress for your latest assistance request."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataState
              isLoading={requestsQuery.isLoading}
              isError={requestsQuery.isError}
              isEmpty={!latestRequest}
              emptyMessage="Submit a request to see your assistance timeline."
            >
              {latestRequest ? (
                <ol className="space-y-0">
                  {STATUS_ORDER.filter((status) => status !== "rejected").map((status, index, list) => {
                    const currentIndex = list.indexOf(
                      latestRequest.status === "rejected" ? "pending" : (latestRequest.status as (typeof list)[number]),
                    );
                    const state =
                      index < currentIndex ? "completed" : index === currentIndex ? "current" : "upcoming";
                    const isLast = index === list.length - 1;
                    return (
                      <li key={status} className="relative flex gap-4 pb-6 last:pb-0">
                        {!isLast && <span className="absolute left-5 top-10 bottom-0 w-px bg-border" aria-hidden="true" />}
                        <span
                          className={cn(
                            "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-lg",
                            state === "completed"
                              ? "bg-primary text-primary-foreground"
                              : state === "current"
                                ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          <FileText className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1 pt-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-foreground">{requestStatusLabel(status)}</p>
                            {state === "current" && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {status === latestRequest.status
                              ? latestRequest.description
                              : `Stage: ${requestStatusLabel(status)}`}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {status === latestRequest.status ? formatShortDate(latestRequest.request_date) : "—"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : null}
            </DataState>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Foundation announcements</CardTitle>
            <CardDescription>Important updates from the Themba Molefe Foundation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataState
              isLoading={notificationsLoading}
              isError={notificationsError}
              isEmpty={notifications.length === 0}
              emptyMessage="No announcements yet."
            >
              {notifications.slice(0, 3).map((announcement) => (
                <article key={announcement.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{announcement.title ?? "Announcement"}</p>
                    {announcement.notification_type ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {formatStatusLabel(announcement.notification_type)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{announcement.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatRelativeTime(announcement.notification_date)}
                  </p>
                </article>
              ))}
            </DataState>
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
                ["Full Name", name],
                ["Email Address", profile?.email ?? "—"],
                ["Phone Number", profile?.phone_number ?? "—"],
                ["Residential Area", beneficiaryRole?.residential_address ?? "—"],
                ["Member Since", memberSince],
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
