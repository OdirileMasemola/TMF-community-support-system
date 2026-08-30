import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileCheck2, HandCoins } from "lucide-react-native";
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
import { formatCurrency, formatShortDate, paymentStatusLabel, verificationStatusLabel } from "@/lib/display";
import { fetchDonorDonations, fetchDonorProofs } from "@/services/donations";

type Filter = "all" | "successful" | "pending";

export default function DonorDonationsScreen() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const [filter, setFilter] = useState<Filter>("all");

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

  const rows = donations.data ?? [];

  const totals = useMemo(
    () => ({
      verified: rows.filter((row) => row.status === "successful").reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
      count: rows.length,
    }),
    [rows],
  );

  const visible = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((row) => row.status === filter);
  }, [filter, rows]);

  if (profileLoading || donations.isLoading) return <LoadingState label="Loading your donation history…" />;

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
      <PageHeading
        eyebrow="History"
        title="Your donations"
        subtitle="Everything you have given, and the status of each payment proof."
      />

      {donations.isError ? <ErrorState /> : null}

      <StatGrid>
        <StatCard label="Total verified" value={formatCurrency(totals.verified)} icon={HandCoins} wide />
        <StatCard label="Donations" value={totals.count} icon={HandCoins} />
        <StatCard
          label="Proofs in review"
          value={(proofs.data ?? []).filter((proof) => proof.verification_status === "pending").length}
          icon={FileCheck2}
          tone="secondary"
        />
      </StatGrid>

      <ChipSelect<Filter>
        options={[
          { label: "All", value: "all" },
          { label: "Verified", value: "successful" },
          { label: "Pending", value: "pending" },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <SectionCard title="Donations">
        {visible.length ? (
          visible.map((donation, index) => (
            <ListRow
              key={donation.id}
              icon={HandCoins}
              label={donation.campaigns?.title ?? "General fund"}
              value={[
                formatCurrency(donation.amount),
                formatShortDate(donation.donation_date),
                donation.payment_reference ?? undefined,
              ]
                .filter(Boolean)
                .join(" · ")}
              right={<Badge label={paymentStatusLabel(donation.status)} status={donation.status} />}
              last={index === visible.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="Nothing to show for this filter." />
        )}
      </SectionCard>

      <SectionCard title="Payment proofs">
        {proofs.isLoading ? (
          <LoadingState />
        ) : proofs.data?.length ? (
          proofs.data.map((proof, index, shown) => (
            <ListRow
              key={proof.id}
              icon={FileCheck2}
              label={proof.donations?.campaigns?.title ?? proof.file_name ?? "Payment proof"}
              value={[formatShortDate(proof.uploaded_at), proof.admin_comment ?? undefined].filter(Boolean).join(" · ")}
              right={<Badge label={verificationStatusLabel(proof.verification_status)} status={proof.verification_status} />}
              last={index === shown.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="No payment proofs uploaded yet." />
        )}
      </SectionCard>
    </Screen>
  );
}
