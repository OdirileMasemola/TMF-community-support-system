import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Megaphone } from "lucide-react-native";
import {
  AppButton,
  Badge,
  ChipSelect,
  EmptyRow,
  ErrorState,
  ListRow,
  LoadingState,
  PageHeading,
  Screen,
  SectionCard,
} from "@/components/ui";
import { campaignProgress, campaignStatusLabel, formatCurrency, formatShortDate } from "@/lib/display";
import { fetchCampaigns } from "@/services/campaigns";

type Filter = "all" | "education" | "health" | "food";

export default function DonorCampaignsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  const campaigns = useQuery({
    queryKey: ["campaigns", "public"],
    queryFn: () => fetchCampaigns({ publicOnly: true }),
  });

  const categories = useMemo(() => {
    const found = new Set<string>();
    for (const campaign of campaigns.data ?? []) {
      if (campaign.category) found.add(campaign.category.toLowerCase());
    }
    return Array.from(found).slice(0, 4);
  }, [campaigns.data]);

  const visible = useMemo(() => {
    const rows = campaigns.data ?? [];
    if (filter === "all") return rows;
    return rows.filter((campaign) => campaign.category?.toLowerCase() === filter);
  }, [campaigns.data, filter]);

  if (campaigns.isLoading) return <LoadingState label="Loading campaigns…" />;

  return (
    <Screen onRefresh={() => campaigns.refetch()} refreshing={campaigns.isFetching}>
      <PageHeading
        eyebrow="Campaigns"
        title="Causes you can support"
        subtitle="Every campaign below is open for donations right now."
      />

      {campaigns.isError ? <ErrorState /> : null}

      {categories.length > 1 ? (
        <ChipSelect<Filter>
          options={[
            { label: "All", value: "all" },
            ...categories.map((category) => ({
              label: category.charAt(0).toUpperCase() + category.slice(1),
              value: category as Filter,
            })),
          ]}
          value={filter}
          onChange={setFilter}
        />
      ) : null}

      <SectionCard title={`${visible.length} open ${visible.length === 1 ? "campaign" : "campaigns"}`}>
        {visible.length ? (
          visible.map((campaign, index) => (
            <ListRow
              key={campaign.id}
              icon={Megaphone}
              label={campaign.title}
              value={`${formatCurrency(campaign.amount_raised)} of ${formatCurrency(campaign.funding_goal)} raised${
                campaign.end_date ? ` · closes ${formatShortDate(campaign.end_date)}` : ""
              }`}
              right={<Badge label={campaignStatusLabel(campaign.status)} status={campaign.status} />}
              progress={campaignProgress(campaign.amount_raised, campaign.funding_goal)}
              last={index === visible.length - 1}
            />
          ))
        ) : (
          <EmptyRow label="No campaigns match this filter." />
        )}
      </SectionCard>

      <AppButton label="Donate now" onPress={() => router.replace("/donor/donate")} />
    </Screen>
  );
}
