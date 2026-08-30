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
import { formatShortDate } from "@/lib/display";
import { fetchCampaigns } from "@/services/campaigns";
import { createCampaignApplication, fetchVolunteerApplications } from "@/services/volunteers";

export default function VolunteerOpportunitiesScreen() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const queryClient = useQueryClient();

  const [openCampaignId, setOpenCampaignId] = useState<string | null>(null);
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [appliedTo, setAppliedTo] = useState<string | null>(null);

  const campaigns = useQuery({
    queryKey: ["campaigns", "active"],
    queryFn: () => fetchCampaigns({ status: "active" }),
  });

  const applications = useQuery({
    queryKey: ["volunteer", "applications", roleProfileId],
    enabled: Boolean(roleProfileId),
    queryFn: () => fetchVolunteerApplications(roleProfileId!),
  });

  const appliedCampaignIds = useMemo(
    () => new Set((applications.data ?? []).map((application) => application.campaign_id)),
    [applications.data],
  );

  const apply = useMutation({
    mutationFn: async (campaignId: string) => {
      if (!roleProfileId) throw new Error("Volunteer profile was not found.");
      return createCampaignApplication({
        volunteer_id: roleProfileId,
        campaign_id: campaignId,
        status: "pending",
        participation_role: role.trim() || null,
      });
    },
    onSuccess: async (_result, campaignId) => {
      setError(null);
      setOpenCampaignId(null);
      setRole("");
      setAppliedTo(campaignId);
      await queryClient.invalidateQueries({ queryKey: ["volunteer"] });
    },
    onError: (mutationError) =>
      setError(mutationError instanceof Error ? mutationError.message : "Could not submit your application."),
  });

  if (profileLoading || campaigns.isLoading) return <LoadingState label="Finding opportunities…" />;

  if (!roleProfileId) {
    return <EmptyState label="Your volunteer profile is not set up yet. Please complete it on the web dashboard." />;
  }

  const rows = campaigns.data ?? [];

  return (
    <Screen
      onRefresh={() => {
        campaigns.refetch();
        applications.refetch();
      }}
      refreshing={campaigns.isFetching}
    >
      <PageHeading
        eyebrow="Opportunities"
        title="Where you can help"
        subtitle="Apply to an active campaign and an organiser will be in touch."
      />

      {campaigns.isError ? <ErrorState /> : null}
      {error ? <ErrorState label={error} /> : null}
      {appliedTo ? <SuccessBanner label="Application submitted. You will hear back once it is reviewed." /> : null}

      <SectionCard title={`${rows.length} active ${rows.length === 1 ? "campaign" : "campaigns"}`}>
        {rows.length ? (
          rows.map((campaign, index) => {
            const alreadyApplied = appliedCampaignIds.has(campaign.id);
            const expanded = openCampaignId === campaign.id;

            return (
              <ListRow
                key={campaign.id}
                icon={Megaphone}
                label={campaign.title}
                value={[campaign.location, campaign.category, campaign.start_date ? formatShortDate(campaign.start_date) : null]
                  .filter(Boolean)
                  .join(" · ")}
                right={alreadyApplied ? <Badge label="Applied" status="pending" /> : undefined}
                last={index === rows.length - 1}
                footer={
                  alreadyApplied ? undefined : expanded ? (
                    <>
                      <TextField
                        label="Preferred role (optional)"
                        value={role}
                        onChangeText={setRole}
                        placeholder="e.g. Packing, driving, admin"
                      />
                      <AppButton
                        label="Submit application"
                        onPress={() => apply.mutate(campaign.id)}
                        loading={apply.isPending}
                      />
                      <AppButton label="Cancel" variant="ghost" onPress={() => setOpenCampaignId(null)} />
                    </>
                  ) : (
                    <AppButton
                      label="Apply"
                      variant="outline"
                      onPress={() => {
                        setAppliedTo(null);
                        setOpenCampaignId(campaign.id);
                      }}
                    />
                  )
                }
              />
            );
          })
        ) : (
          <EmptyRow label="There are no active campaigns right now. Check back soon." />
        )}
      </SectionCard>
    </Screen>
  );
}
