import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileCheck2, HandCoins, Receipt } from "lucide-react-native";
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
import { formatCurrency, formatShortDate, paymentStatusLabel, verificationStatusLabel } from "@/lib/display";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { fetchDonorDonations, fetchDonorProofs } from "@/services/donations";

export default function DonorDashboard() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();

  const donations = useQuery({
    queryKey: ["donor", "donations", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchDonorDonations(roleProfileId!),
  });

  const proofs = useQuery({
    queryKey: ["donor", "proofs", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchDonorProofs(roleProfileId!),
  });

  const totals = useMemo(() => {
    const rows = donations.data ?? [];
    const verified = rows.filter((row) => row.status === "successful");
    return {
      given: verified.reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
      count: rows.length,
      pending: rows.filter((row) => row.status === "pending").length,
      awaitingProof: (proofs.data ?? []).filter((proof) => proof.verification_status === "pending").length,
    };
  }, [donations.data, proofs.data]);

  if (profileLoading || donations.isLoading) {
    return <LoadingState label="Loading your giving history…" />;
  }

  if (!roleProfileId) {
    return <EmptyState label="Your donor profile is not set up yet. Please complete it on the web dashboard." />;
  }

  return (
    <Screen
      onRefresh={() => {
        donations.refetch();
        proofs.refetch();
      }}
      refreshing={donations.isFetching || proofs.isFetching}
    >
      <PageHeading eyebrow="Donor" title="Your giving" subtitle="Donations, receipts and payment proofs." />

      {donations.isError ? <ErrorState /> : null}

      <StatGrid>
        <StatCard
          label="Total given"
          value={formatCurrency(totals.given)}
          hint="Verified donations only"
          icon={HandCoins}
          wide
        />
        <StatCard label="Donations" value={totals.count} hint={`${totals.pending} pending`} icon={Receipt} />
        <StatCard label="Proofs in review" value={totals.awaitingProof} icon={FileCheck2} tone="secondary" />
      </StatGrid>

      <SectionCard title="Recent donations">
        {donations.data?.length ? (
          donations.data.slice(0, 8).map((donation, index, shown) => (
            <ListRow
              key={donation.id}
              icon={HandCoins}
              label={donation.campaigns?.title ?? "General fund"}
              value={`${formatCurrency(donation.amount)} · ${formatShortDate(donation.donation_date)}`}
              right={<Badge label={paymentStatusLabel(donation.status)} status={donation.status} />}
              last={index === shown.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="You have not made any donations yet." />
        )}
      </SectionCard>

      <SectionCard title="Payment proofs">
        {proofs.isLoading ? (
          <LoadingState />
        ) : proofs.data?.length ? (
          proofs.data.slice(0, 5).map((proof, index, shown) => (
            <ListRow
              key={proof.id}
              icon={FileCheck2}
              label={proof.donations?.campaigns?.title ?? proof.file_name ?? "Payment proof"}
              value={formatShortDate(proof.uploaded_at)}
              right={<Badge label={verificationStatusLabel(proof.verification_status)} status={proof.verification_status} />}
              last={index === shown.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="No payment proofs uploaded." />
        )}
      </SectionCard>
    </Screen>
  );
}
