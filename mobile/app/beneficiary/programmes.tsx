import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, MapPin } from "lucide-react-native";
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
} from "@/components/ui";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { formatShortDate, formatStatusLabel } from "@/lib/display";
import { fetchBeneficiaryRequests, fetchCollectionSchedulesForRequests } from "@/services/assistance";

export default function BeneficiaryProgrammesScreen() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();

  const requests = useQuery({
    queryKey: ["beneficiary", "requests", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchBeneficiaryRequests(roleProfileId!),
  });

  const requestIds = useMemo(() => (requests.data ?? []).map((request) => request.id), [requests.data]);

  const schedules = useQuery({
    queryKey: ["beneficiary", "schedules", requestIds],
    enabled: requestIds.length > 0,
    queryFn: () => fetchCollectionSchedulesForRequests(requestIds),
  });

  const { upcoming, past } = useMemo(() => {
    const rows = schedules.data ?? [];
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return {
      upcoming: rows.filter((row) => new Date(row.collection_date) >= startOfToday),
      past: rows.filter((row) => new Date(row.collection_date) < startOfToday),
    };
  }, [schedules.data]);

  if (profileLoading || requests.isLoading) return <LoadingState label="Loading your collections…" />;

  if (!roleProfileId) {
    return <EmptyState label="Your beneficiary profile is not set up yet. Please complete it on the web dashboard." />;
  }

  return (
    <Screen
      onRefresh={() => {
        requests.refetch();
        schedules.refetch();
      }}
      refreshing={requests.isFetching || schedules.isFetching}
    >
      <PageHeading
        eyebrow="Programmes"
        title="Collections"
        subtitle="Where and when to collect what has been approved for you."
      />

      {requests.isError || schedules.isError ? <ErrorState /> : null}

      <SectionCard title="Upcoming">
        {schedules.isLoading ? (
          <LoadingState />
        ) : upcoming.length ? (
          upcoming.map((schedule, index) => (
            <ListRow
              key={schedule.id}
              icon={CalendarCheck2}
              label={schedule.programme_name ?? "Collection"}
              value={[
                formatShortDate(schedule.collection_date),
                schedule.collection_time ?? undefined,
                schedule.location,
              ]
                .filter(Boolean)
                .join(" · ")}
              right={<Badge label={formatStatusLabel(schedule.status)} status={schedule.status} />}
              last={index === upcoming.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="No collections scheduled yet. You will be notified once one is set." />
        )}
      </SectionCard>

      <SectionCard title="Past collections">
        {past.length ? (
          past.map((schedule, index) => (
            <ListRow
              key={schedule.id}
              icon={MapPin}
              label={schedule.programme_name ?? "Collection"}
              value={`${formatShortDate(schedule.collection_date)} · ${schedule.location}`}
              right={<Badge label={formatStatusLabel(schedule.status)} status={schedule.status} />}
              last={index === past.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="Nothing here yet." />
        )}
      </SectionCard>
    </Screen>
  );
}
