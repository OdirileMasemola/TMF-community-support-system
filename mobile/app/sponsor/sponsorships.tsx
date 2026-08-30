import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Handshake } from "lucide-react-native";
import {
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
import { campaignProgress, formatCurrency, formatShortDate, paymentStatusLabel } from "@/lib/display";
import { fetchSponsorSponsorships } from "@/services/sponsorships";

type Filter = "all" | "successful" | "pending";

export default function SponsorSponsorshipsScreen() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const [filter, setFilter] = useState<Filter>("all");

  const sponsorships = useQuery({
    queryKey: ["sponsor", "sponsorships", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchSponsorSponsorships(roleProfileId!),
  });

  const rows = sponsorships.data ?? [];

  const totals = useMemo(
    () => ({
      committed: rows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
      confirmed: rows
        .filter((row) => row.status === "successful")
        .reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
    }),
    [rows],
  );

  const visible = useMemo(() => (filter === "all" ? rows : rows.filter((row) => row.status === filter)), [filter, rows]);

  if (profileLoading || sponsorships.isLoading) return <LoadingState label="Loading your commitments…" />;

  if (!roleProfileId) {
    return <EmptyState label="Your sponsor profile is not set up yet. Please complete it on the web dashboard." />;
  }

  return (
    <Screen onRefresh={() => sponsorships.refetch()} refreshing={sponsorships.isFetching}>
      <PageHeading
        eyebrow="Sponsorship"
        title="Your commitments"
        subtitle="What you have pledged and the impact it is funding."
      />

      {sponsorships.isError ? <ErrorState /> : null}

      <StatGrid>
        <StatCard label="Total committed" value={formatCurrency(totals.committed)} icon={Handshake} wide />
        <StatCard label="Confirmed" value={formatCurrency(totals.confirmed)} icon={CheckCircle2} tone="secondary" />
        <StatCard label="Commitments" value={rows.length} icon={Handshake} />
      </StatGrid>

      <ChipSelect<Filter>
        options={[
          { label: "All", value: "all" },
          { label: "Confirmed", value: "successful" },
          { label: "Pending", value: "pending" },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <SectionCard title="Commitments">
        {visible.length ? (
          visible.map((sponsorship, index) => (
            <ListRow
              key={sponsorship.id}
              icon={Handshake}
              label={sponsorship.campaigns?.title ?? "General sponsorship"}
              value={[
                formatCurrency(sponsorship.amount),
                formatShortDate(sponsorship.sponsorship_date),
                sponsorship.sponsorship_type ?? undefined,
              ]
                .filter(Boolean)
                .join(" · ")}
              right={<Badge label={paymentStatusLabel(sponsorship.status)} status={sponsorship.status} />}
              progress={
                sponsorship.campaigns
                  ? campaignProgress(sponsorship.campaigns.amount_raised, sponsorship.campaigns.funding_goal)
                  : undefined
              }
              last={index === visible.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="Nothing to show for this filter." />
        )}
      </SectionCard>
    </Screen>
  );
}
