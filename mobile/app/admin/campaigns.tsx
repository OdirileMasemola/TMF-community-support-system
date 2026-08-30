import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus } from "lucide-react-native";
import {
  AppButton,
  Badge,
  ButtonRow,
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
  SuccessBanner,
  TextField,
} from "@/components/ui";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { campaignProgress, campaignStatusLabel, formatCurrency, formatShortDate } from "@/lib/display";
import { createCampaign, fetchCampaigns, updateCampaign } from "@/services/campaigns";
import type { CampaignStatus } from "@/types/database.types";
import { useTheme } from "@/theme/ThemeProvider";

type Filter = "all" | CampaignStatus;

export default function AdminCampaignsScreen() {
  const { roleProfileId, isLoading: profileLoading } = useRoleProfile();
  const queryClient = useQueryClient();
  const { colors } = useTheme();

  const [filter, setFilter] = useState<Filter>("all");
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [goal, setGoal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const campaigns = useQuery({
    queryKey: ["admin", "campaigns"],
    queryFn: () => fetchCampaigns(),
  });

  const rows = campaigns.data ?? [];

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((campaign) => campaign.status === filter)),
    [filter, rows],
  );

  const onError = (mutationError: unknown) =>
    setError(mutationError instanceof Error ? mutationError.message : "Could not save the campaign.");

  const create = useMutation({
    mutationFn: async () => {
      if (!roleProfileId) throw new Error("Administrator profile was not found.");
      if (!title.trim()) throw new Error("Give the campaign a title.");
      if (!location.trim()) throw new Error("Add a location.");
      if (!description.trim()) throw new Error("Add a short description.");

      const parsedGoal = Number(goal.replace(/[^0-9.]/g, ""));

      return createCampaign({
        admin_id: roleProfileId,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        start_date: new Date().toISOString().slice(0, 10),
        category: category.trim() || null,
        funding_goal: Number.isFinite(parsedGoal) && parsedGoal > 0 ? parsedGoal : null,
        status: "draft",
        is_public: false,
      });
    },
    onSuccess: async () => {
      setError(null);
      setCreated(true);
      setComposing(false);
      setTitle("");
      setDescription("");
      setLocation("");
      setCategory("");
      setGoal("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CampaignStatus }) =>
      updateCampaign(id, { status, is_public: status === "active" }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError,
  });

  if (profileLoading || campaigns.isLoading) return <LoadingState label="Loading campaigns…" />;

  if (!roleProfileId) {
    return <EmptyState label="Your administrator profile is not set up yet. Please complete it on the web dashboard." />;
  }

  return (
    <Screen onRefresh={() => campaigns.refetch()} refreshing={campaigns.isFetching}>
      <PageHeading
        eyebrow="Administration"
        title="Campaigns"
        subtitle="Publish, pause and close the foundation's campaigns."
      />

      {campaigns.isError ? <ErrorState /> : null}
      {error ? <ErrorState label={error} /> : null}
      {created ? <SuccessBanner label="Campaign created as a draft. Publish it when you are ready." /> : null}

      <StatGrid>
        <StatCard label="Active" value={rows.filter((row) => row.status === "active").length} icon={Megaphone} />
        <StatCard
          label="Raised"
          value={formatCurrency(rows.reduce((sum, row) => sum + Number(row.amount_raised ?? 0), 0))}
          icon={Megaphone}
          tone="secondary"
        />
      </StatGrid>

      {composing ? (
        <SectionCard title="New campaign">
          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Winter blanket drive" />
          <TextField
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What is this campaign for?"
            multiline
          />
          <TextField label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Alexandra" />
          <TextField label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Food" />
          <TextField
            label="Funding goal (ZAR)"
            value={goal}
            onChangeText={setGoal}
            placeholder="150000"
            keyboardType="decimal-pad"
          />
          <AppButton label="Create draft" onPress={() => create.mutate()} loading={create.isPending} />
          <AppButton label="Cancel" variant="ghost" onPress={() => setComposing(false)} />
        </SectionCard>
      ) : (
        <AppButton
          label="New campaign"
          variant="outline"
          icon={<Plus size={18} color={colors.foreground} />}
          onPress={() => {
            setCreated(false);
            setComposing(true);
          }}
        />
      )}

      <ChipSelect<Filter>
        options={[
          { label: "All", value: "all" },
          { label: "Active", value: "active" },
          { label: "Draft", value: "draft" },
          { label: "Closed", value: "closed" },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <SectionCard title={`${visible.length} ${visible.length === 1 ? "campaign" : "campaigns"}`}>
        {visible.length ? (
          visible.map((campaign, index) => (
            <ListRow
              key={campaign.id}
              icon={Megaphone}
              label={campaign.title}
              value={[
                `${formatCurrency(campaign.amount_raised)} of ${formatCurrency(campaign.funding_goal)}`,
                campaign.location,
                campaign.end_date ? `closes ${formatShortDate(campaign.end_date)}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              right={<Badge label={campaignStatusLabel(campaign.status)} status={campaign.status} />}
              progress={campaignProgress(campaign.amount_raised, campaign.funding_goal)}
              last={index === visible.length - 1}
              footer={
                <ButtonRow>
                  <AppButton
                    label="Publish"
                    onPress={() => setStatus.mutate({ id: campaign.id, status: "active" })}
                    disabled={setStatus.isPending || campaign.status === "active"}
                  />
                  <AppButton
                    label="Close"
                    variant="outline"
                    onPress={() => setStatus.mutate({ id: campaign.id, status: "closed" })}
                    disabled={setStatus.isPending || campaign.status === "closed"}
                  />
                </ButtonRow>
              }
            />
          ))
        ) : (
          <EmptyRow label="No campaigns match this filter." />
        )}
      </SectionCard>
    </Screen>
  );
}
