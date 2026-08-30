import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, HeartHandshake, PackageOpen, Truck } from "lucide-react-native";
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
import { formatShortDate, formatStatusLabel, requestStatusLabel } from "@/lib/display";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { fetchBeneficiaryRequests, fetchCollectionSchedulesForRequests } from "@/services/assistance";

export default function BeneficiaryDashboard() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();

  const requests = useQuery({
    queryKey: ["beneficiary", "requests", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchBeneficiaryRequests(roleProfileId!),
  });

  const requestIds = useMemo(() => (requests.data ?? []).map((row) => row.id), [requests.data]);

  const schedules = useQuery({
    queryKey: ["beneficiary", "schedules", requestIds],
    enabled: requestIds.length > 0,
    queryFn: () => fetchCollectionSchedulesForRequests(requestIds),
  });

  const totals = useMemo(() => {
    const rows = requests.data ?? [];
    return {
      open: rows.filter((row) => row.status === "pending" || row.status === "under_review").length,
      approved: rows.filter((row) => row.status === "approved").length,
      total: rows.length,
    };
  }, [requests.data]);

  if (profileLoading || requests.isLoading) {
    return <LoadingState label="Loading your requests…" />;
  }

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
        eyebrow="Beneficiary"
        title="Your support"
        subtitle="Assistance requests and upcoming collection dates."
      />

      {requests.isError ? <ErrorState /> : null}

      <StatGrid>
        <StatCard label="Open requests" value={totals.open} icon={PackageOpen} wide />
        <StatCard label="Approved" value={totals.approved} icon={CheckCircle2} />
        <StatCard label="All requests" value={totals.total} icon={HeartHandshake} tone="secondary" />
      </StatGrid>

      <SectionCard title="Upcoming collections">
        {schedules.isLoading ? (
          <LoadingState />
        ) : schedules.data?.length ? (
          schedules.data.slice(0, 5).map((schedule, index, shown) => (
            <ListRow
              key={schedule.id}
              icon={Truck}
              label={schedule.programme_name ?? "Collection"}
              value={[formatShortDate(schedule.collection_date), schedule.collection_time, schedule.location]
                .filter(Boolean)
                .join(" · ")}
              right={<Badge label={formatStatusLabel(schedule.status)} status={schedule.status} />}
              last={index === shown.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="Nothing scheduled yet." />
        )}
      </SectionCard>

      <SectionCard title="Your requests">
        {requests.data?.length ? (
          requests.data.slice(0, 8).map((request, index, shown) => (
            <ListRow
              key={request.id}
              icon={PackageOpen}
              label={formatStatusLabel(request.request_type)}
              value={formatShortDate(request.request_date)}
              right={<Badge label={requestStatusLabel(request.status)} status={request.status} />}
              last={index === shown.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="You have not submitted a request yet." />
        )}
      </SectionCard>
    </Screen>
  );
}
