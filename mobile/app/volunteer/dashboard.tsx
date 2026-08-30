import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Clock, MapPin } from "lucide-react-native";
import {
  Badge,
  EmptyRow,
  EmptyState,
  ErrorState,
  LoadingState,
  ListRow,
  PageHeading,
  Screen,
  SectionCard,
  StatCard,
  StatGrid,
} from "@/components/ui";
import { applicationStatusLabel, assignmentStatusLabel, formatShortDate } from "@/lib/display";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { fetchVolunteerApplications, fetchVolunteerAssignments, fetchVolunteerHours } from "@/services/volunteers";

export default function VolunteerDashboard() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const enabled = Boolean(roleProfileId);

  const applications = useQuery({
    queryKey: ["volunteer", "applications", roleProfileId],
    enabled,
    queryFn: () => fetchVolunteerApplications(roleProfileId!),
  });

  const assignments = useQuery({
    queryKey: ["volunteer", "assignments", roleProfileId],
    enabled,
    queryFn: () => fetchVolunteerAssignments(roleProfileId!),
  });

  const hours = useQuery({
    queryKey: ["volunteer", "hours", roleProfileId],
    enabled,
    queryFn: () => fetchVolunteerHours(roleProfileId!),
  });

  const totals = useMemo(
    () => ({
      loggedHours: (hours.data ?? []).reduce((sum, row) => sum + Number(row.hours ?? 0), 0),
      activeAssignments: (assignments.data ?? []).filter((row) => row.status === "active").length,
      pendingApplications: (applications.data ?? []).filter((row) => row.status === "pending").length,
    }),
    [hours.data, assignments.data, applications.data],
  );

  if (profileLoading || applications.isLoading) {
    return <LoadingState label="Loading your volunteering…" />;
  }

  if (!roleProfileId) {
    return <EmptyState label="Your volunteer profile is not set up yet. Please complete it on the web dashboard." />;
  }

  return (
    <Screen
      onRefresh={() => {
        applications.refetch();
        assignments.refetch();
        hours.refetch();
      }}
      refreshing={applications.isFetching || assignments.isFetching || hours.isFetching}
    >
      <PageHeading
        eyebrow="Volunteer"
        title="Your volunteering"
        subtitle="Assignments, applications and the hours you have logged."
      />

      {applications.isError ? <ErrorState /> : null}

      <StatGrid>
        <StatCard label="Hours logged" value={totals.loggedHours} icon={Clock} wide />
        <StatCard label="Active assignments" value={totals.activeAssignments} icon={MapPin} />
        <StatCard
          label="Applications"
          value={applications.data?.length ?? 0}
          hint={`${totals.pendingApplications} pending`}
          icon={ClipboardList}
          tone="secondary"
        />
      </StatGrid>

      <SectionCard title="Current assignments">
        {assignments.isLoading ? (
          <LoadingState />
        ) : assignments.data?.length ? (
          assignments.data.slice(0, 6).map((assignment, index, shown) => (
            <ListRow
              key={assignment.id}
              icon={MapPin}
              label={assignment.campaigns?.title ?? assignment.role ?? "Assignment"}
              value={
                [assignment.location, assignment.schedule].filter(Boolean).join(" · ") ||
                formatShortDate(assignment.start_date)
              }
              right={<Badge label={assignmentStatusLabel(assignment.status)} status={assignment.status} />}
              last={index === shown.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="No assignments yet." />
        )}
      </SectionCard>

      <SectionCard title="Applications">
        {applications.data?.length ? (
          applications.data.slice(0, 6).map((application, index, shown) => (
            <ListRow
              key={application.id}
              icon={ClipboardList}
              label={application.campaigns?.title ?? "Campaign"}
              value={formatShortDate(application.application_date)}
              right={<Badge label={applicationStatusLabel(application.status)} status={application.status} />}
              last={index === shown.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="You have not applied to any campaigns." />
        )}
      </SectionCard>

      <SectionCard title="Recent hours">
        {hours.isLoading ? (
          <LoadingState />
        ) : hours.data?.length ? (
          hours.data.slice(0, 5).map((entry, index, shown) => (
            <ListRow
              key={entry.id}
              icon={Clock}
              label={`${entry.hours} hours`}
              value={formatShortDate(entry.work_date)}
              last={index === shown.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="No hours logged yet." />
        )}
      </SectionCard>
    </Screen>
  );
}
