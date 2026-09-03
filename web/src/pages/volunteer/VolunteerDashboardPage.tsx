import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, Briefcase, ClipboardList, Clock3, HeartHandshake, Search } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivityCard } from "@/components/dashboard/RecentActivityCard";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { volunteerQuickActions } from "@/data/volunteerDashboardData";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { useNotifications } from "@/hooks/useNotifications";
import {
  applicationStatusLabel,
  assignmentStatusLabel,
  formatMonthYear,
  formatRelativeTime,
  formatShortDate,
  formatStatusLabel,
  getInitials,
} from "@/lib/display";
import { fetchCampaigns } from "@/services/campaigns";
import type { VolunteerProfile } from "@/services/profiles";
import {
  fetchVolunteerApplications,
  fetchVolunteerAssignments,
  fetchVolunteerHours,
} from "@/services/volunteers";
import foodSupportImage from "@/assets/images/campaigns/Food Support Drive.webp";

export function VolunteerDashboardPage() {
  const { profile, roleProfile, roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const volunteerRole = roleProfile as VolunteerProfile | null;
  const { notifications, isLoading: notificationsLoading, isError: notificationsError } = useNotifications(5);

  const enabled = Boolean(roleProfileId);

  const applicationsQuery = useQuery({
    queryKey: ["volunteer-applications", roleProfileId],
    enabled,
    queryFn: () => fetchVolunteerApplications(roleProfileId!),
  });
  const assignmentsQuery = useQuery({
    queryKey: ["volunteer-assignments", roleProfileId],
    enabled,
    queryFn: () => fetchVolunteerAssignments(roleProfileId!),
  });
  const hoursQuery = useQuery({
    queryKey: ["volunteer-hours", roleProfileId],
    enabled,
    queryFn: () => fetchVolunteerHours(roleProfileId!),
  });
  const campaignsQuery = useQuery({
    queryKey: ["campaigns", "public-active"],
    queryFn: () => fetchCampaigns({ publicOnly: true }),
  });

  const applications = applicationsQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];
  const hours = hoursQuery.data ?? [];
  const campaigns = campaignsQuery.data ?? [];

  const name = profile?.full_name ?? "Volunteer";
  const initials = getInitials(name);
  const totalHours = hours.reduce((sum, row) => sum + Number(row.hours ?? 0), 0);
  const now = new Date();
  const thisMonthHours = hours
    .filter((row) => {
      const date = new Date(row.work_date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, row) => sum + Number(row.hours ?? 0), 0);
  const completedAssignments = assignments.filter((item) => item.status === "completed").length;
  const activeAssignments = assignments.filter((item) => item.status !== "completed");
  const campaignsSupported = new Set(assignments.map((item) => item.campaign_id)).size;
  const averageHours =
    completedAssignments > 0 ? Math.round((totalHours / completedAssignments) * 10) / 10 : totalHours > 0 ? totalHours : 0;
  const monthlyProgress = Math.min(100, Math.round((thisMonthHours / 20) * 100));

  const statistics = [
    {
      id: "applications",
      title: "Applications",
      value: String(applications.length),
      detail: "Submitted to date",
      icon: ClipboardList,
    },
    {
      id: "assignments",
      title: "Active Assignments",
      value: String(activeAssignments.length),
      detail: "Currently participating",
      icon: Briefcase,
    },
    {
      id: "hours",
      title: "Hours Contributed",
      value: String(totalHours),
      detail: "Total volunteer time",
      icon: Clock3,
    },
    {
      id: "campaigns",
      title: "Campaigns Supported",
      value: String(campaignsSupported),
      detail: "Helping local communities",
      icon: HeartHandshake,
    },
  ];

  const recentApplications = applications.slice(0, 3);
  const featuredOpportunities = campaigns.slice(0, 3);
  const pageLoading =
    profileLoading ||
    (enabled && (applicationsQuery.isLoading || assignmentsQuery.isLoading || hoursQuery.isLoading)) ||
    campaignsQuery.isLoading;
  const pageError =
    applicationsQuery.isError || assignmentsQuery.isError || hoursQuery.isError || campaignsQuery.isError;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Volunteer workspace</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              {initials}
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Welcome back, {name.split(" ")[0]}
            </h1>
          </div>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            Thank you for volunteering your time to support the Themba Molefe Foundation.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Volunteer Status:</span>{" "}
              <span className="font-medium text-foreground">
                {volunteerRole?.status ? formatStatusLabel(volunteerRole.status) : "—"}
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Member Since:</span>{" "}
              <span className="font-medium text-foreground">{formatMonthYear(volunteerRole?.member_since)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Volunteer Hours:</span>{" "}
              <span className="font-medium text-foreground">{totalHours} hours</span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button to="/volunteer/opportunities">
            <Search className="mr-2 size-4" />
            View Opportunities
          </Button>
          <Button to="/volunteer/applications" variant="outline">
            <ClipboardList className="mr-2 size-4" />
            My Applications
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

        <DashboardCard className="col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Volunteer applications</CardTitle>
            <CardDescription>Your latest campaign and opportunity applications.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <DataState
              isLoading={pageLoading}
              isError={pageError}
              isEmpty={recentApplications.length === 0}
              emptyMessage="No applications yet. Browse opportunities to get started."
            >
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 font-semibold">Campaign</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Applied</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((application) => (
                    <tr key={application.id} className="border-b border-border last:border-0">
                      <td className="py-4">
                        <p className="font-medium text-foreground">{application.campaigns?.title ?? "Campaign"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{application.campaigns?.category ?? "—"}</p>
                      </td>
                      <td className="py-4 text-muted-foreground">{application.participation_role ?? "—"}</td>
                      <td className="py-4 text-muted-foreground">{formatShortDate(application.application_date)}</td>
                      <td className="py-4">
                        <AdminStatusBadge status={applicationStatusLabel(application.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataState>
            <Button to="/volunteer/applications" variant="ghost" size="sm" className="mt-4">
              View all applications
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Volunteer hours</CardTitle>
            <CardDescription>Your contribution so far this year.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tracking-tight text-foreground">{totalHours}</p>
            <p className="mt-1 text-sm text-muted-foreground">Total volunteer hours</p>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">This month</span>
                <span className="font-medium text-foreground">{thisMonthHours} hours</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Completed assignments</span>
                <span className="font-medium text-foreground">{completedAssignments}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Avg per assignment</span>
                <span className="font-medium text-foreground">{averageHours} hours</span>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Monthly progress</span>
                <span>{monthlyProgress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${monthlyProgress}%` }} />
              </div>
            </div>
            <Button to="/volunteer/hours" variant="outline" size="sm" className="mt-5 w-full">
              View hours
            </Button>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2">
          <CardHeader>
            <CardTitle>Active assignments</CardTitle>
            <CardDescription>Campaigns you are currently participating in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataState
              isLoading={assignmentsQuery.isLoading}
              isError={assignmentsQuery.isError}
              isEmpty={activeAssignments.length === 0}
              emptyMessage="No active assignments yet."
            >
              {activeAssignments.slice(0, 3).map((assignment) => (
                <article key={assignment.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{assignment.campaigns?.title ?? "Campaign"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{assignment.role}</p>
                    </div>
                    <AdminStatusBadge status={assignmentStatusLabel(assignment.status)} />
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <p>
                      Location: <span className="text-foreground">{assignment.location ?? "—"}</span>
                    </p>
                    <p>
                      Schedule: <span className="text-foreground">{assignment.schedule ?? "—"}</span>
                    </p>
                    <p>
                      Start: <span className="text-foreground">{formatShortDate(assignment.start_date)}</span>
                    </p>
                    <p>
                      End: <span className="text-foreground">{formatShortDate(assignment.end_date)}</span>
                    </p>
                  </div>
                  <Button to="/volunteer/assignments" variant="ghost" size="sm" className="mt-3 px-0">
                    View assignment
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Button>
                </article>
              ))}
            </DataState>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2">
          <CardHeader>
            <CardTitle>Recommended opportunities</CardTitle>
            <CardDescription>Open roles you can apply for next.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataState
              isLoading={campaignsQuery.isLoading}
              isError={campaignsQuery.isError}
              isEmpty={featuredOpportunities.length === 0}
              emptyMessage="No open opportunities right now."
            >
              {featuredOpportunities.map((opportunity) => (
                <article key={opportunity.id} className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                  <img
                    src={opportunity.image_url || foodSupportImage}
                    alt=""
                    className="hidden h-20 w-28 shrink-0 rounded-lg object-cover sm:block"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {opportunity.category ?? "Campaign"}
                    </p>
                    <p className="mt-1 font-medium text-foreground">{opportunity.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {opportunity.location} · {formatShortDate(opportunity.start_date)}
                    </p>
                    <Button to="/volunteer/opportunities" variant="ghost" size="sm" className="mt-2 px-0">
                      Apply now
                      <ArrowRight className="ml-1.5 size-3.5" />
                    </Button>
                  </div>
                </article>
              ))}
            </DataState>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Your latest volunteer updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataState
              isLoading={notificationsLoading}
              isError={notificationsError}
              isEmpty={notifications.length === 0}
              emptyMessage="No recent notifications yet."
            >
              {notifications.slice(0, 3).map((activity) => (
                <RecentActivityCard
                  key={activity.id}
                  title={activity.title ?? "Notification"}
                  description={activity.message}
                  timestamp={formatRelativeTime(activity.notification_date)}
                  icon={Bell}
                />
              ))}
            </DataState>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Foundation updates</CardTitle>
            <CardDescription>Important updates for TMF volunteers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataState
              isLoading={notificationsLoading}
              isError={notificationsError}
              isEmpty={notifications.length === 0}
              emptyMessage="No foundation updates yet."
            >
              {notifications.slice(0, 3).map((update) => (
                <article key={update.id} className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                    <Bell className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{update.title ?? "Update"}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{update.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatRelativeTime(update.notification_date)}</p>
                  </div>
                </article>
              ))}
            </DataState>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Volunteer profile</CardTitle>
            <CardDescription>Your current volunteer details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Full Name", name],
                ["Volunteer ID", volunteerRole?.id ? `VOL-${volunteerRole.id.slice(0, 8).toUpperCase()}` : "—"],
                ["Email Address", profile?.email ?? "—"],
                ["Phone Number", profile?.phone_number ?? "—"],
                ["Member Since", formatMonthYear(volunteerRole?.member_since)],
                ["Volunteer Status", volunteerRole?.status ? formatStatusLabel(volunteerRole.status) : "—"],
                ["Preferred Area", volunteerRole?.preferred_area ?? "—"],
                ["Total Hours", `${totalHours}`],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-1 font-medium text-foreground">{value}</p>
                </div>
              ))}
            </div>
            <Button to="/volunteer/profile" variant="outline" size="sm" className="mt-5">
              Edit Profile
            </Button>
          </CardContent>
        </DashboardCard>

        <DashboardCard className="col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>Your time creates real impact.</CardTitle>
            <CardDescription>
              Every hour you contribute helps the Themba Molefe Foundation support communities, run campaigns, and reach
              people who need assistance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HeartHandshake className="size-5" />
            </span>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button to="/volunteer/opportunities" size="sm">
                <Search className="mr-2 size-4" />
                Find More Opportunities
              </Button>
              <Button to="/volunteer/assignments" variant="outline" size="sm">
                <Briefcase className="mr-2 size-4" />
                View My Assignments
              </Button>
            </div>
          </CardContent>
        </DashboardCard>
      </div>

      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-foreground md:text-2xl">Quick actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">Common volunteer actions in one place.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {volunteerQuickActions.map((action) => (
            <QuickActionCard key={action.id} {...action} />
          ))}
        </div>
      </section>
    </div>
  );
}
