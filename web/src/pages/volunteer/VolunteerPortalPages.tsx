import {
  Bell,
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
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import foodSupportImage from "@/assets/images/campaigns/Food Support Drive.webp";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { AnimatedGlowingSearchBar } from "@/components/ui/AnimatedGlowingSearchBar";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useNotifications } from "@/hooks/useNotifications";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import {
  applicationStatusLabel,
  assignmentStatusLabel,
  formatMonthYear,
  formatRelativeTime,
  formatShortDate,
  formatStatusLabel,
  getInitials,
  notificationIsUnread,
} from "@/lib/display";
import { cn } from "@/lib/utils";
import { fetchCampaigns } from "@/services/campaigns";
import {
  updateProfile,
  updateVolunteerProfile,
  type VolunteerProfile,
} from "@/services/profiles";
import {
  createCampaignApplication,
  createVolunteerHours,
  fetchVolunteerApplications,
  fetchVolunteerAssignments,
  fetchVolunteerHours,
} from "@/services/volunteers";

function ApplicationStatusBadge({ status }: { status: string }) {
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

export function VolunteerOpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { roleProfileId } = useRoleProfile();

  const campaignsQuery = useQuery({
    queryKey: ["campaigns", "public-active"],
    queryFn: () => fetchCampaigns({ publicOnly: true }),
  });
  const applicationsQuery = useQuery({
    queryKey: ["volunteer-applications", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchVolunteerApplications(roleProfileId!),
  });

  const applyMutation = useMutation({
    mutationFn: (campaignId: string) => {
      if (!roleProfileId) throw new Error("Volunteer profile not found.");
      return createCampaignApplication({
        volunteer_id: roleProfileId,
        campaign_id: campaignId,
      });
    },
    onSuccess: async () => {
      toast.success("Application submitted");
      await queryClient.invalidateQueries({ queryKey: ["volunteer-applications", roleProfileId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not submit application");
    },
  });

  const appliedCampaignIds = useMemo(
    () => new Set((applicationsQuery.data ?? []).map((item) => item.campaign_id)),
    [applicationsQuery.data],
  );

  const filteredOpportunities = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();
    return (campaignsQuery.data ?? []).filter((opportunity) => {
      const searchableContent = [
        opportunity.title,
        opportunity.description,
        opportunity.category,
        opportunity.location,
      ]
        .join(" ")
        .toLowerCase();
      return searchableContent.includes(normalizedSearchQuery);
    });
  }, [campaignsQuery.data, searchQuery]);

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

      <DataState
        isLoading={campaignsQuery.isLoading}
        isError={campaignsQuery.isError}
        isEmpty={filteredOpportunities.length === 0}
        emptyMessage={
          searchQuery.trim()
            ? "Try a different search term to find volunteer opportunities."
            : "No open opportunities are available right now."
        }
      >
        <div className="grid gap-px bg-border md:grid-cols-2">
          {filteredOpportunities.map((opportunity) => {
            const alreadyApplied = appliedCampaignIds.has(opportunity.id);
            return (
              <DashboardCard key={opportunity.id} className="overflow-hidden">
                <img
                  src={opportunity.image_url || foodSupportImage}
                  alt=""
                  className="h-44 w-full object-cover"
                />
                <CardHeader>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {opportunity.category ?? "Campaign"}
                  </p>
                  <CardTitle>{opportunity.title}</CardTitle>
                  <CardDescription>{opportunity.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      Location: <span className="text-foreground">{opportunity.location}</span>
                    </p>
                    <p>
                      Date: <span className="text-foreground">{formatShortDate(opportunity.start_date)}</span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="mt-5 w-full"
                    disabled={!roleProfileId || alreadyApplied || applyMutation.isPending}
                    onClick={() => applyMutation.mutate(opportunity.id)}
                  >
                    <Search className="mr-2 size-4" />
                    {alreadyApplied ? "Applied" : "Apply Now"}
                  </Button>
                </CardContent>
              </DashboardCard>
            );
          })}
        </div>
      </DataState>
    </AdminPageShell>
  );
}

export function VolunteerApplicationsPage() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const applicationsQuery = useQuery({
    queryKey: ["volunteer-applications", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchVolunteerApplications(roleProfileId!),
  });
  const applications = applicationsQuery.data ?? [];

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
      <DataState
        isLoading={profileLoading || applicationsQuery.isLoading}
        isError={applicationsQuery.isError}
        isEmpty={applications.length === 0}
        emptyMessage="You have not submitted any applications yet."
      >
        <VolunteerTable>
          <thead>
            <tr>
              {["Campaign", "Role", "Applied", "Status", ""].map((label) => (
                <th key={label || "actions"} className={tableHeadClass}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td className={tableCellClass}>
                  <p className="font-medium">{application.campaigns?.title ?? "Campaign"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{application.campaigns?.category ?? "—"}</p>
                </td>
                <td className={tableCellClass}>{application.participation_role ?? "—"}</td>
                <td className={tableCellClass}>{formatShortDate(application.application_date)}</td>
                <td className={tableCellClass}>
                  <ApplicationStatusBadge status={applicationStatusLabel(application.status)} />
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
      </DataState>
    </AdminPageShell>
  );
}

export function VolunteerAssignmentsPage() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const assignmentsQuery = useQuery({
    queryKey: ["volunteer-assignments", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchVolunteerAssignments(roleProfileId!),
  });
  const assignments = assignmentsQuery.data ?? [];

  return (
    <AdminPageShell
      label="Volunteering"
      title="My assignments"
      description="Review your active and upcoming volunteer assignments."
    >
      <DataState
        isLoading={profileLoading || assignmentsQuery.isLoading}
        isError={assignmentsQuery.isError}
        isEmpty={assignments.length === 0}
        emptyMessage="No assignments yet."
      >
        <div className="grid gap-px bg-border lg:grid-cols-2">
          {assignments.map((assignment) => (
            <DashboardCard key={assignment.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>{assignment.campaigns?.title ?? "Campaign"}</CardTitle>
                    <CardDescription className="mt-1">{assignment.role}</CardDescription>
                  </div>
                  <AdminStatusBadge status={assignmentStatusLabel(assignment.status)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <span className="text-muted-foreground">Location</span>
                  <span className="text-right font-medium text-foreground">{assignment.location ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <span className="text-muted-foreground">Start date</span>
                  <span className="text-right font-medium text-foreground">{formatShortDate(assignment.start_date)}</span>
                </div>
                <div className="flex justify-between gap-4 border-b border-border pb-3">
                  <span className="text-muted-foreground">End date</span>
                  <span className="text-right font-medium text-foreground">{formatShortDate(assignment.end_date)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Schedule</span>
                  <span className="text-right font-medium text-foreground">{assignment.schedule ?? "—"}</span>
                </div>
                <Button to="/volunteer/hours" variant="outline" size="sm" className="mt-2 w-full">
                  Record hours
                </Button>
              </CardContent>
            </DashboardCard>
          ))}
        </div>
      </DataState>
    </AdminPageShell>
  );
}

export function VolunteerHoursPage() {
  const queryClient = useQueryClient();
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const [assignmentId, setAssignmentId] = useState("");
  const [hoursValue, setHoursValue] = useState("");
  const [workDate, setWorkDate] = useState("");
  const [notes, setNotes] = useState("");

  const hoursQuery = useQuery({
    queryKey: ["volunteer-hours", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchVolunteerHours(roleProfileId!),
  });
  const assignmentsQuery = useQuery({
    queryKey: ["volunteer-assignments", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchVolunteerAssignments(roleProfileId!),
  });

  const hours = hoursQuery.data ?? [];
  const assignments = assignmentsQuery.data ?? [];
  const totalHours = hours.reduce((sum, row) => sum + Number(row.hours ?? 0), 0);
  const now = new Date();
  const thisMonthHours = hours
    .filter((row) => {
      const date = new Date(row.work_date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, row) => sum + Number(row.hours ?? 0), 0);
  const completedAssignments = assignments.filter((item) => item.status === "completed").length;
  const averageHours =
    completedAssignments > 0 ? Math.round((totalHours / completedAssignments) * 10) / 10 : totalHours > 0 ? totalHours : 0;
  const monthlyProgress = Math.min(100, Math.round((thisMonthHours / 20) * 100));

  const createHoursMutation = useMutation({
    mutationFn: () => {
      if (!roleProfileId) throw new Error("Volunteer profile not found.");
      const parsedHours = Number(hoursValue);
      if (!workDate || !parsedHours || parsedHours <= 0) {
        throw new Error("Please provide valid hours and a work date.");
      }
      return createVolunteerHours({
        volunteer_id: roleProfileId,
        assignment_id: assignmentId || null,
        hours: parsedHours,
        work_date: workDate,
        notes: notes.trim() || null,
      });
    },
    onSuccess: async () => {
      toast.success("Hours recorded");
      setAssignmentId("");
      setHoursValue("");
      setWorkDate("");
      setNotes("");
      await queryClient.invalidateQueries({ queryKey: ["volunteer-hours", roleProfileId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not record hours");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createHoursMutation.mutate();
  }

  const hourMetrics = [
    { label: "Total volunteer hours", value: `${totalHours}` },
    { label: "This month", value: `${thisMonthHours} hours` },
    { label: "Completed assignments", value: `${completedAssignments}` },
    { label: "Average hours per assignment", value: `${averageHours} hours` },
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
            <span>{monthlyProgress}%</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${monthlyProgress}%` }} />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            You have contributed {thisMonthHours} hours this month across your completed assignments.
          </p>
        </CardContent>
      </DashboardCard>

      <div className="mt-px grid gap-px bg-border lg:grid-cols-2">
        <DashboardCard>
          <CardHeader>
            <CardTitle>Record hours</CardTitle>
            <CardDescription>Log volunteer time against an assignment when available.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="form-grid" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Assignment (optional)
                <select
                  className="rounded-lg border border-border bg-card px-3 py-2 text-card-foreground"
                  value={assignmentId}
                  onChange={(event) => setAssignmentId(event.target.value)}
                >
                  <option value="">No linked assignment</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.campaigns?.title ?? "Campaign"} — {assignment.role}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Hours"
                type="number"
                min="0.5"
                step="0.5"
                value={hoursValue}
                onChange={(event) => setHoursValue(event.target.value)}
                required
              />
              <Input
                label="Work date"
                type="date"
                value={workDate}
                onChange={(event) => setWorkDate(event.target.value)}
                required
              />
              <Input label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
              <Button type="submit" disabled={!roleProfileId || createHoursMutation.isPending}>
                Save hours
              </Button>
            </form>
          </CardContent>
        </DashboardCard>

        <DashboardCard>
          <CardHeader>
            <CardTitle>Hours log</CardTitle>
            <CardDescription>Your recorded volunteer hours.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataState
              isLoading={profileLoading || hoursQuery.isLoading}
              isError={hoursQuery.isError}
              isEmpty={hours.length === 0}
              emptyMessage="No hours recorded yet."
            >
              {hours.map((entry) => {
                const linked = assignments.find((item) => item.id === entry.assignment_id);
                return (
                  <article key={entry.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{entry.hours} hours</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {linked?.campaigns?.title ?? "General volunteer time"}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatShortDate(entry.work_date)}</p>
                    </div>
                    {entry.notes ? <p className="mt-2 text-sm text-muted-foreground">{entry.notes}</p> : null}
                  </article>
                );
              })}
            </DataState>
          </CardContent>
        </DashboardCard>
      </div>
    </AdminPageShell>
  );
}

export function VolunteerNotificationsPage() {
  const { notifications, isLoading, isError, markAllRead, markRead } = useNotifications();

  return (
    <AdminPageShell
      label="Your account"
      title="Notifications"
      description="Stay up to date with applications, assignments, and foundation updates."
      actions={
        <Button
          type="button"
          variant="outline"
          disabled={markAllRead.isPending || notifications.every((item) => !notificationIsUnread(item.status))}
          onClick={() =>
            markAllRead.mutate(undefined, {
              onSuccess: () => toast.success("All notifications marked as read"),
              onError: (error: Error) => toast.error(error.message),
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
                      <Bell className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn("font-medium text-foreground", unread && "text-primary")}>
                          {notification.title ?? "Notification"}
                        </p>
                        {notification.notification_type ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {formatStatusLabel(notification.notification_type)}
                          </span>
                        ) : null}
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

export function VolunteerProfilePage() {
  const { profile, roleProfile, roleProfileId, isLoading } = useRoleProfile();
  const volunteerRole = roleProfile as VolunteerProfile | null;
  const hoursQuery = useQuery({
    queryKey: ["volunteer-hours", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchVolunteerHours(roleProfileId!),
  });
  const totalHours = (hoursQuery.data ?? []).reduce((sum, row) => sum + Number(row.hours ?? 0), 0);
  const name = profile?.full_name ?? "Volunteer";

  const profileDetails: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "Email address", value: profile?.email ?? "—", icon: Mail },
    { label: "Phone number", value: profile?.phone_number ?? "—", icon: Phone },
    { label: "Member since", value: formatMonthYear(volunteerRole?.member_since), icon: Clock3 },
    { label: "Preferred volunteer area", value: volunteerRole?.preferred_area ?? "—", icon: MapPin },
  ];

  return (
    <AdminPageShell
      label="Your account"
      title="Volunteer profile"
      description="Your current volunteer details and preferences."
      actions={
        <Button to="/volunteer/settings" variant="outline">
          <UserRound className="mr-2 size-4" />
          Edit profile
        </Button>
      }
    >
      <DataState isLoading={isLoading} isEmpty={!profile} emptyMessage="Profile not found.">
        <div className="grid gap-px bg-border lg:grid-cols-[0.75fr_1.25fr]">
          <DashboardCard>
            <CardContent className="flex flex-col items-center py-10 text-center">
              <span className="flex size-20 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
                {getInitials(name)}
              </span>
              <p className="mt-4 text-lg font-semibold text-foreground">{name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {volunteerRole?.id ? `VOL-${volunteerRole.id.slice(0, 8).toUpperCase()}` : "—"}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary">
                <CheckCircle2 className="size-4" />
                {volunteerRole?.status ? formatStatusLabel(volunteerRole.status) : "Volunteer"} volunteer
              </span>
              <p className="mt-3 text-sm text-muted-foreground">{totalHours} hours contributed</p>
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
      </DataState>
    </AdminPageShell>
  );
}

export function VolunteerSettingsPage() {
  const queryClient = useQueryClient();
  const { profile, roleProfile, roleProfileId, session, isLoading, refetch } = useRoleProfile();
  const volunteerRole = roleProfile as VolunteerProfile | null;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredArea, setPreferredArea] = useState("");
  const [residentialAddress, setResidentialAddress] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone_number ?? "");
    setPreferredArea(volunteerRole?.preferred_area ?? "");
    setResidentialAddress(volunteerRole?.residential_address ?? "");
    setAvailabilityStatus(volunteerRole?.availability_status ?? "");
  }, [profile, volunteerRole]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const userId = session?.user.id ?? profile?.id;
      if (!userId || !roleProfileId) throw new Error("Volunteer profile not found.");
      await updateProfile(userId, {
        full_name: fullName.trim(),
        phone_number: phone.trim() || null,
      });
      await updateVolunteerProfile(roleProfileId, {
        preferred_area: preferredArea.trim() || null,
        residential_address: residentialAddress.trim() || null,
        availability_status: availabilityStatus.trim() || null,
      });
    },
    onSuccess: async () => {
      toast.success("Settings saved");
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ["role-profile"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not save settings");
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveMutation.mutate();
  }

  return (
    <AdminPageShell
      label="Your account"
      title="Settings"
      description="Manage your account preferences and volunteer profile details."
    >
      <div className="grid gap-px bg-border lg:grid-cols-2">
        <DashboardCard>
          <CardHeader>
            <CardTitle>Account settings</CardTitle>
            <CardDescription>Contact details and profile preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataState isLoading={isLoading} isEmpty={!profile} emptyMessage="Profile not found.">
              <form className="form-grid" onSubmit={handleSubmit}>
                <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                <Input label="Email address" value={profile?.email ?? ""} readOnly />
                <Input label="Phone number" value={phone} onChange={(event) => setPhone(event.target.value)} />
                <Input
                  label="Preferred volunteer area"
                  value={preferredArea}
                  onChange={(event) => setPreferredArea(event.target.value)}
                />
                <Input
                  label="Residential address"
                  value={residentialAddress}
                  onChange={(event) => setResidentialAddress(event.target.value)}
                />
                <Input
                  label="Availability status"
                  value={availabilityStatus}
                  onChange={(event) => setAvailabilityStatus(event.target.value)}
                  placeholder="e.g. Available weekends"
                />
                <Button type="submit" disabled={saveMutation.isPending}>
                  Save changes
                </Button>
              </form>
            </DataState>
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
