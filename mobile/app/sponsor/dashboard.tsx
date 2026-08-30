import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Handshake, Target } from "lucide-react-native";
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
import { campaignProgress, formatCurrency, formatShortDate, formatStatusLabel } from "@/lib/display";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { fetchOpenSponsorshipRequests, fetchSponsorSponsorships } from "@/services/sponsorships";

export default function SponsorDashboard() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();

  const sponsorships = useQuery({
    queryKey: ["sponsor", "sponsorships", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchSponsorSponsorships(roleProfileId!),
  });

  const openRequests = useQuery({
    queryKey: ["sponsor", "open-requests"],
    queryFn: fetchOpenSponsorshipRequests,
  });

  const totals = useMemo(() => {
    const rows = sponsorships.data ?? [];
    const confirmed = rows.filter((row) => row.status === "successful");
    return {
      committed: confirmed.reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
      confirmed: confirmed.length,
      pending: rows.filter((row) => row.status === "pending").length,
      total: rows.length,
    };
  }, [sponsorships.data]);

  if (profileLoading || sponsorships.isLoading) {
    return <LoadingState label="Loading your sponsorships…" />;
  }

  if (!roleProfileId) {
    return <EmptyState label="Your sponsor profile is not set up yet. Please complete it on the web dashboard." />;
  }

  return (
    <Screen
      onRefresh={() => {
        sponsorships.refetch();
        openRequests.refetch();
      }}
      refreshing={sponsorships.isFetching || openRequests.isFetching}
    >
      <PageHeading
        eyebrow="Sponsor"
        title="Your sponsorships"
        subtitle="Commitments and campaigns still looking for support."
      />

      {sponsorships.isError ? <ErrorState /> : null}

      <StatGrid>
        <StatCard
          label="Total committed"
          value={formatCurrency(totals.committed)}
          hint="Confirmed sponsorships"
          icon={Handshake}
          wide
        />
        <StatCard
          label="Confirmed"
          value={totals.confirmed}
          hint={`${totals.pending} pending of ${totals.total}`}
          icon={Building2}
        />
        <StatCard label="Open requests" value={openRequests.data?.length ?? 0} icon={Target} tone="secondary" />
      </StatGrid>

      <SectionCard title="Your commitments">
        {sponsorships.data?.length ? (
          sponsorships.data.slice(0, 6).map((sponsorship, index, shown) => (
            <ListRow
              key={sponsorship.id}
              icon={Handshake}
              label={sponsorship.campaigns?.title ?? "Campaign"}
              value={`${formatCurrency(sponsorship.amount)} · ${formatShortDate(sponsorship.sponsorship_date)}`}
              right={<Badge label={formatStatusLabel(sponsorship.status)} status={sponsorship.status} />}
              progress={campaignProgress(sponsorship.campaigns?.amount_raised, sponsorship.campaigns?.funding_goal)}
              last={index === shown.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="No sponsorships recorded yet." />
        )}
      </SectionCard>

      <SectionCard title="Requests needing sponsors">
        {openRequests.isLoading ? (
          <LoadingState />
        ) : openRequests.data?.length ? (
          openRequests.data.slice(0, 6).map((request, index, shown) => (
            <ListRow
              key={request.id}
              icon={Target}
              label={request.title}
              value={[request.requested_support, request.deadline ? `by ${formatShortDate(request.deadline)}` : null]
                .filter(Boolean)
                .join(" · ")}
              right={
                request.priority ? <Badge label={formatStatusLabel(request.priority)} status={request.priority} /> : undefined
              }
              last={index === shown.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="No open requests right now." />
        )}
      </SectionCard>
    </Screen>
  );
}
