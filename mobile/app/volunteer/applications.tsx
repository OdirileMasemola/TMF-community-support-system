import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ClipboardList } from "lucide-react-native";
import {
  Badge,
  EmptyRow,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  PageHeading,
  Screen,
  SectionCard,
  StatCard,
  StatGrid,
} from "@/components/ui";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { applicationStatusLabel, assignmentStatusLabel, formatShortDate } from "@/lib/display";
import { fetchVolunteerApplications, fetchVolunteerAssignments } from "@/services/volunteers";

export default function VolunteerApplicationsScreen() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();

  const applications = useQuery({
    queryKey: ["volunteer", "applications", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchVolunteerApplications(roleProfileId!),
  });

  const assignments = useQuery({
    queryKey: ["volunteer", "assignments", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchVolunteerAssignments(roleProfileId!),
  });

  if (profileLoading || applications.isLoading) return <LoadingState label="Loading your applications…" />;

  if (!roleProfileId) {
    return <EmptyState label="Your volunteer profile is not set up yet. Please complete it on the web dashboard." />;
  }

  const applicationRows = applications.data ?? [];
  const assignmentRows = assignments.data ?? [];

  return (
    <Screen
      onRefresh={() => {
        applications.refetch();
        assignments.refetch();
      }}
      refreshing={applications.isFetching || assignments.isFetching}
    >
      <PageHeading
        eyebrow="Volunteering"
        title="Applications and assignments"
        subtitle="Track what you applied for and what you have been placed on."
      />

      {applications.isError ? <ErrorState /> : null}

      <StatGrid>
        <StatCard
          label="Pending"
          value={applicationRows.filter((row) => row.status === "pending").length}
          icon={ClipboardList}
        />
        <StatCard
          label="Approved"
          value={applicationRows.filter((row) => row.status === "approved").length}
          icon={ClipboardList}
          tone="secondary"
        />
        <StatCard
          label="Active assignments"
          value={assignmentRows.filter((row) => row.status === "active").length}
          icon={CalendarClock}
          wide
        />
      </StatGrid>

      <SectionCard title="Current assignments">
        {assignments.isLoading ? (
          <LoadingState />
        ) : assignmentRows.length ? (
          assignmentRows.map((assignment, index) => (
            <ListRow
              key={assignment.id}
              icon={CalendarClock}
              label={assignment.campaigns?.title ?? assignment.role ?? "Assignment"}
              value={[
                assignment.role,
                assignment.location ?? assignment.campaigns?.location,
                assignment.schedule,
                assignment.start_date ? `from ${formatShortDate(assignment.start_date)}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              right={<Badge label={assignmentStatusLabel(assignment.status)} status={assignment.status} />}
              last={index === assignmentRows.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="You have no assignments yet." />
        )}
      </SectionCard>

      <SectionCard title="Applications">
        {applicationRows.length ? (
          applicationRows.map((application, index) => (
            <ListRow
              key={application.id}
              icon={ClipboardList}
              label={application.campaigns?.title ?? "Campaign"}
              value={[
                application.participation_role,
                application.campaigns?.location,
                `applied ${formatShortDate(application.application_date)}`,
              ]
                .filter(Boolean)
                .join(" · ")}
              right={<Badge label={applicationStatusLabel(application.status)} status={application.status} />}
              last={index === applicationRows.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="You have not applied to any campaigns yet." />
        )}
      </SectionCard>
    </Screen>
  );
}
