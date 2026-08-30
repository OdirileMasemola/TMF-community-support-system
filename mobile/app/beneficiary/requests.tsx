import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Inbox } from "lucide-react-native";
import {
  AppButton,
  Badge,
  ChipSelect,
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
import { formatShortDate, formatStatusLabel, requestStatusLabel } from "@/lib/display";
import { fetchBeneficiaryRequests } from "@/services/assistance";

type Filter = "all" | "open" | "approved" | "completed";

export default function BeneficiaryRequestsScreen() {
  const router = useRouter();
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const [filter, setFilter] = useState<Filter>("all");

  const requests = useQuery({
    queryKey: ["beneficiary", "requests", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchBeneficiaryRequests(roleProfileId!),
  });

  const rows = requests.data ?? [];

  const visible = useMemo(() => {
    switch (filter) {
      case "open":
        return rows.filter((row) => row.status === "pending" || row.status === "under_review");
      case "approved":
        return rows.filter((row) => row.status === "approved");
      case "completed":
        return rows.filter((row) => row.status === "completed");
      default:
        return rows;
    }
  }, [filter, rows]);

  if (profileLoading || requests.isLoading) return <LoadingState label="Loading your requests…" />;

  if (!roleProfileId) {
    return <EmptyState label="Your beneficiary profile is not set up yet. Please complete it on the web dashboard." />;
  }

  return (
    <Screen onRefresh={() => requests.refetch()} refreshing={requests.isFetching}>
      <PageHeading
        eyebrow="Assistance"
        title="Your requests"
        subtitle="Every request you have made and where it stands."
      />

      {requests.isError ? <ErrorState /> : null}

      <StatGrid>
        <StatCard
          label="Open"
          value={rows.filter((row) => row.status === "pending" || row.status === "under_review").length}
          icon={Inbox}
        />
        <StatCard label="Approved" value={rows.filter((row) => row.status === "approved").length} icon={Inbox} tone="secondary" />
      </StatGrid>

      <ChipSelect<Filter>
        options={[
          { label: "All", value: "all" },
          { label: "Open", value: "open" },
          { label: "Approved", value: "approved" },
          { label: "Completed", value: "completed" },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <SectionCard title="Requests">
        {visible.length ? (
          visible.map((request, index) => (
            <ListRow
              key={request.id}
              icon={Inbox}
              label={request.request_type}
              value={[
                request.description,
                `submitted ${formatShortDate(request.request_date)}`,
                request.priority ? `${formatStatusLabel(request.priority)} priority` : null,
                request.admin_notes ? `Note: ${request.admin_notes}` : null,
              ]
                .filter(Boolean)
                .join("\n")}
              right={<Badge label={requestStatusLabel(request.status)} status={request.status} />}
              last={index === visible.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="Nothing to show for this filter." />
        )}
      </SectionCard>

      <AppButton label="Make a new request" onPress={() => router.replace("/beneficiary/request")} />
    </Screen>
  );
}
