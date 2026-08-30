import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react-native";
import {
  AppButton,
  Badge,
  EmptyRow,
  EmptyState,
  ErrorState,
  ListRow,
  LoadingState,
  PageHeading,
  Screen,
  SectionCard,
  SuccessBanner,
  TextField,
} from "@/components/ui";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { campaignProgress, campaignStatusLabel, formatCurrency, formatShortDate } from "@/lib/display";
import { fetchCampaigns } from "@/services/campaigns";
import { createSponsorship, fetchSponsorSponsorships } from "@/services/sponsorships";

const today = () => new Date().toISOString().slice(0, 10);

export default function SponsorCampaignsScreen() {
  const { roleProfile, roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const queryClient = useQueryClient();

  const [openCampaignId, setOpenCampaignId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pledged, setPledged] = useState(false);

  const campaigns = useQuery({
    queryKey: ["campaigns", "active"],
    queryFn: () => fetchCampaigns({ status: "active" }),
  });

  const sponsorships = useQuery({
    queryKey: ["sponsor", "sponsorships", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchSponsorSponsorships(roleProfileId!),
  });

  const sponsoredCampaignIds = useMemo(
    () => new Set((sponsorships.data ?? []).map((row) => row.campaign_id)),
    [sponsorships.data],
  );

  const pledge = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!roleProfileId) throw new Error("Sponsor profile was not found.");
      const parsed = Number(amount.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(parsed) || parsed <= 0) throw new Error("Enter the amount you want to commit.");

      return createSponsorship({
        sponsor_id: roleProfileId,
        campaign_id: campaignId,
        amount: parsed,
        sponsorship_date: today(),
        sponsorship_type: (roleProfile as { sponsorship_type?: string | null } | null)?.sponsorship_type ?? null,
        status: "pending",
      });
    },
    onSuccess: async () => {
      setError(null);
      setOpenCampaignId(null);
      setAmount("");
      setPledged(true);
      await queryClient.invalidateQueries({ queryKey: ["sponsor"] });
    },
    onError: (mutationError) =>
      setError(mutationError instanceof Error ? mutationError.message : "Could not record your commitment."),
  });

  if (profileLoading || campaigns.isLoading) return <LoadingState label="Loading campaigns…" />;

  if (!roleProfileId) {
    return <EmptyState label="Your sponsor profile is not set up yet. Please complete it on the web dashboard." />;
  }

  const rows = campaigns.data ?? [];

  return (
    <Screen onRefresh={() => campaigns.refetch()} refreshing={campaigns.isFetching}>
      <PageHeading
        eyebrow="Campaigns"
        title="Campaigns to sponsor"
        subtitle="Commit funding to an active campaign. Finance confirms each pledge."
      />

      {campaigns.isError ? <ErrorState /> : null}
      {error ? <ErrorState label={error} /> : null}
      {pledged ? <SuccessBanner label="Commitment recorded and awaiting confirmation." /> : null}

      <SectionCard title={`${rows.length} active ${rows.length === 1 ? "campaign" : "campaigns"}`}>
        {rows.length ? (
          rows.map((campaign, index) => {
            const expanded = openCampaignId === campaign.id;

            return (
              <ListRow
                key={campaign.id}
                icon={Megaphone}
                label={campaign.title}
                value={`${formatCurrency(campaign.amount_raised)} of ${formatCurrency(campaign.funding_goal)} raised${
                  campaign.end_date ? ` · closes ${formatShortDate(campaign.end_date)}` : ""
                }`}
                right={
                  sponsoredCampaignIds.has(campaign.id) ? (
                    <Badge label="Sponsored" status="approved" />
                  ) : (
                    <Badge label={campaignStatusLabel(campaign.status)} status={campaign.status} />
                  )
                }
                progress={campaignProgress(campaign.amount_raised, campaign.funding_goal)}
                last={index === rows.length - 1}
                footer={
                  expanded ? (
                    <>
                      <TextField
                        label="Amount to commit (ZAR)"
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="25000"
                        keyboardType="decimal-pad"
                      />
                      <AppButton
                        label="Confirm commitment"
                        onPress={() => pledge.mutate(campaign.id)}
                        loading={pledge.isPending}
                      />
                      <AppButton label="Cancel" variant="ghost" onPress={() => setOpenCampaignId(null)} />
                    </>
                  ) : (
                    <AppButton
                      label="Sponsor this campaign"
                      variant="outline"
                      onPress={() => {
                        setPledged(false);
                        setOpenCampaignId(campaign.id);
                      }}
                    />
                  )
                }
              />
            );
          })
        ) : (
          <EmptyRow label="No active campaigns right now." />
        )}
      </SectionCard>
    </Screen>
  );
}
