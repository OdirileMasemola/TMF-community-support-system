import {
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Search,
  Settings2,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { AnimatedGlowingSearchBar } from "@/components/ui/AnimatedGlowingSearchBar";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  volunteerApplications,
  volunteerAssignments,
  volunteerHoursSummary,
  volunteerNotifications,
  volunteerOpportunities,
  volunteerProfile,
  type ApplicationStatus,
} from "@/data/volunteerDashboardData";
import { cn } from "@/lib/utils";

function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const tone =
    status === "Approved" || status === "Completed"
      ? "bg-primary/10 text-primary"
      : status === "Pending"
        ? "bg-secondary text-secondary-foreground"
        : "bg-destructive/10 text-destructive";

  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", tone)}>{status}</span>;
}

function VolunteerTable({ children }: { children: ReactNode }) {
  return (
    <DashboardCard className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">{children}</table>
    </DashboardCard>
  );
}

const tableHeadClass =
  "border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const tableCellClass = "border-b border-border px-5 py-4 align-middle text-foreground last:border-b-0";

const profileDetails: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Email address", value: volunteerProfile.email, icon: Mail },
  { label: "Phone number", value: volunteerProfile.phone, icon: Phone },
  { label: "Member since", value: volunteerProfile.memberSince, icon: Clock3 },
  { label: "Preferred volunteer area", value: volunteerProfile.preferredArea, icon: MapPin },
];

export function VolunteerOpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOpportunities = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return volunteerOpportunities.filter((opportunity) => {
      const searchableContent = [
        opportunity.title,
        opportunity.description,
        opportunity.category,
        opportunity.location,
        opportunity.roles.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchableContent.includes(normalizedSearchQuery);
    });
  }, [searchQuery]);

  return (
    <AdminPageShell
      label="Volunteering"
      title="Browse opportunities"
      description="Explore open volunteer roles across Themba Molefe Foundation campaigns."
    >
      <div className="mb-6 flex justify-center">
        <AnimatedGlowingSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search opportunities..."
        />
      </div>

      {filteredOpportunities.length > 0 ? (
        <div className="grid gap-px bg-border md:grid-cols-2">
          {filteredOpportunities.map((opportunity) => (
            <DashboardCard key={opportunity.id} className="overflow-hidden">
              <img src={opportunity.image} alt="" className="h-44 w-full object-cover" />
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{opportunity.category}</p>
                <CardTitle>{opportunity.title}</CardTitle>
                <CardDescription>{opportunity.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    Location: <span className="text-foreground">{opportunity.location}</span>
                  </p>
                  <p>
                    Date: <span className="text-foreground">{opportunity.date}</span>
                  </p>
                  <p>
                    Roles: <span className="text-foreground">{opportunity.roles.join(", ")}</span>
                  </p>
                </div>
                <Button to="/volunteer/applications" className="mt-5 w-full">
                  <Search className="mr-2 size-4" />
                  Apply Now
                </Button>
              </CardContent>
            </DashboardCard>
          ))}
        </div>
      ) : (
        <DashboardCard>
          <CardContent className="py-10 text-center">
            <h2 className="text-xl font-semibold text-foreground">No opportunities found</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Try a different search term to find volunteer opportunities.
            </p>
          </CardContent>
        </DashboardCard>
      )}
    </AdminPageShell>
  );
}

export function VolunteerApplicationsPage() {
  return (
    <AdminPageShell
      label="Volunteering"
      title="My applications"
      description="Track every campaign and opportunity application you have submitted."
      actions={
        <Button to="/volunteer/opportunities">
          <Search className="mr-2 size-4" />
          Browse opportunities
        </Button>
      }
    >
      <VolunteerTable>
        <thead>
          <tr>
            {["Campaign", "Role", "Applied", "Status", ""].map((label) => (
              <th key={label} className={tableHeadClass}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {volunteerApplications.map((application) => (
            <tr key={application.id}>
              <td className={tableCellClass}>
                <p className="font-medium">{application.campaign}</p>
                <p className="mt-1 text-xs text-muted-foreground">{application.category}</p>
              </td>
              <td className={tableCellClass}>{application.preferredRole}</td>
              <td className={tableCellClass}>{application.appliedDate}</td>
              <td className={tableCellClass}>
                <ApplicationStatusBadge status={application.status} />
              </td>
              <td className={tableCellClass}>
                <Button variant="ghost" size="sm">
                  View details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </VolunteerTable>
    </AdminPageShell>
  );
}

export function VolunteerAssignmentsPage() {
  return (
    <AdminPageShell
      label="Volunteering"
      title="My assignments"
      description="Review your active and upcoming volunteer assignments."
    >
      <div className="grid gap-px bg-border lg:grid-cols-2">
        {volunteerAssignments.map((assignment) => (
          <DashboardCard key={assignment.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{assignment.campaign}</CardTitle>
                  <CardDescription className="mt-1">{assignment.role}</CardDescription>
                </div>
                <AdminStatusBadge status={assignment.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <span className="text-muted-foreground">Location</span>
                <span className="text-right font-medium text-foreground">{assignment.location}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <span className="text-muted-foreground">Start date</span>
                <span className="text-right font-medium text-foreground">{assignment.startDate}</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <span className="text-muted-foreground">End date</span>
                <span className="text-right font-medium text-foreground">{assignment.endDate}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Schedule</span>
                <span className="text-right font-medium text-foreground">{assignment.schedule}</span>
              </div>
              <Button variant="outline" size="sm" className="mt-2 w-full">
                View assignment
              </Button>
            </CardContent>
          </DashboardCard>
        ))}
      </div>
    </AdminPageShell>
  );
}

export function VolunteerHoursPage() {
  const hourMetrics = [
    { label: "Total volunteer hours", value: `${volunteerHoursSummary.totalHours}` },
    { label: "This month", value: `${volunteerHoursSummary.thisMonth} hours` },
    { label: "Completed assignments", value: `${volunteerHoursSummary.completedAssignments}` },
    { label: "Average hours per assignment", value: `${volunteerHoursSummary.averageHoursPerAssignment} hours` },
  ];

  return (
    <AdminPageShell
      label="Volunteering"
      title="Volunteer hours"
      description="Track your contribution hours and monthly progress."
    >
      <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-4">
        {hourMetrics.map((metric) => (
          <DashboardCard key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-semibold tracking-tight text-foreground">{metric.value}</p>
            </CardContent>
          </DashboardCard>
        ))}
      </div>

      <DashboardCard className="mt-px">
        <CardHeader>
          <CardTitle>Monthly contribution</CardTitle>
          <CardDescription>A simple view of your progress toward this month&apos;s volunteer hours.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{volunteerHoursSummary.monthlyProgress}%</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${volunteerHoursSummary.monthlyProgress}%` }} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            You have contributed {volunteerHoursSummary.thisMonth} hours this month across your completed assignments.
          </p>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}

export function VolunteerNotificationsPage() {
  return (
    <AdminPageShell
      label="Your account"
      title="Notifications"
      description="Stay up to date with applications, assignments, and foundation updates."
      actions={<Button variant="outline">Mark all read</Button>}
    >
      <DashboardCard>
        <CardContent>
          <ul className="divide-y divide-border">
            {volunteerNotifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <li key={notification.id} className="flex items-start gap-4 py-5 first:pt-0 last:pb-0">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                    <Icon className="size-5" />
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

export function VolunteerProfilePage() {
  return (
    <AdminPageShell
      label="Your account"
      title="Volunteer profile"
      description="Your current volunteer details and preferences."
      actions={
        <Button variant="outline">
          <UserRound className="mr-2 size-4" />
          Edit profile
        </Button>
      }
    >
      <div className="grid gap-px bg-border lg:grid-cols-[0.75fr_1.25fr]">
        <DashboardCard>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <span className="flex size-20 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
              {volunteerProfile.initials}
            </span>
            <p className="mt-4 text-lg font-semibold text-foreground">{volunteerProfile.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{volunteerProfile.volunteerId}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary">
              <CheckCircle2 className="size-4" />
              {volunteerProfile.status} volunteer
            </span>
            <p className="mt-3 text-sm text-muted-foreground">{volunteerProfile.totalHours} hours contributed</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            {profileDetails.map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Icon className="size-3.5 text-primary" />
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

export function VolunteerSettingsPage() {
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
            <CardDescription>Contact details and profile preferences.</CardDescription>
          </CardHeader>
          <CardContent className="form-grid">
            <Input label="Email address" defaultValue={volunteerProfile.email} />
            <Input label="Phone number" defaultValue={volunteerProfile.phone} />
            <Input label="Preferred volunteer area" defaultValue={volunteerProfile.preferredArea} />
            <Button type="button">Save changes</Button>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Choose the updates you would like to receive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {["Application status updates", "Assignment reminders", "Foundation announcements"].map((label) => (
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
              <Settings2 className="size-5 text-primary" />
              Your selected theme is applied across the volunteer portal.
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
