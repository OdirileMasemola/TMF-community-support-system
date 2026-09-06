import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatedGlowingSearchBar } from "@/components/ui/AnimatedGlowingSearchBar";
import { CampaignEmptyState } from "@/components/ui/CampaignEmptyState";
import { CampaignHeroPreview } from "@/components/ui/CampaignHeroPreview";
import { CampaignListCard } from "@/components/ui/CampaignListCard";
import { PageHero } from "@/components/ui/PageHero";
import { resolveCampaignImage } from "@/lib/campaignImages";
import { campaignStatusLabel, formatCurrency, formatShortDate } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { fetchCampaigns } from "@/services/campaigns";
import type { Campaign, CampaignStatus } from "@/types/public";

type CampaignFilter = "All" | CampaignStatus;

const filters: CampaignFilter[] = ["All", "Active", "Upcoming", "Completed"];

function mapPublicCampaignStatus(status: string): CampaignStatus {
  const label = campaignStatusLabel(status);
  if (label === "Active") return "Active";
  if (label === "Draft") return "Upcoming";
  return "Completed";
}

// so this page is public and allows users to view campaigns without authentication
export function CampaignsPage() {
  const [activeFilter, setActiveFilter] = useState<CampaignFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const campaignsQuery = useQuery({
    queryKey: ["public-campaigns"],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchCampaigns({ publicOnly: true }),
  });

  const campaigns: Campaign[] = useMemo(() => {
    return (campaignsQuery.data ?? [])
      .filter((campaign) => campaign.status !== "cancelled")
      .map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        category: campaign.category ?? "General",
        status: mapPublicCampaignStatus(campaign.status),
        startDate: formatShortDate(campaign.start_date),
        endDate: formatShortDate(campaign.end_date),
        goal: campaign.funding_goal != null ? formatCurrency(campaign.funding_goal) : "Support this campaign",
        image: resolveCampaignImage(campaign.image_url, campaign.title, campaign.category),
      }));
  }, [campaignsQuery.data]);

  const filteredCampaigns = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesFilter = activeFilter === "All" || campaign.status === activeFilter;
      const searchableContent = [campaign.title, campaign.description, campaign.category].join(" ").toLowerCase();

      return matchesFilter && searchableContent.includes(normalizedSearchQuery);
    });
  }, [activeFilter, campaigns, searchQuery]);

  return (
    <>
      <PageHero
        label="CAMPAIGNS"
        title="Support campaigns that"
        highlightedTitle="make a difference."
        subtitle="Explore active and upcoming foundation campaigns focused on food support, youth education, winter relief, and community assistance."
        primaryCta={{ text: "View Campaigns", to: "#campaign-list" }}
        secondaryCta={{ text: "Get Involved", to: "/get-involved" }}
      >
        <CampaignHeroPreview />
      </PageHero>

      <section id="campaign-list" className="-mt-16 px-6 pb-16 pt-0 md:-mt-24 md:pt-2">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-center gap-6">
            <AnimatedGlowingSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search campaigns..."
            />

            <div className="flex flex-wrap items-center justify-center gap-3">
              {filters.map((filter) => {
                const isActive = activeFilter === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-foreground hover:border-primary/60 hover:text-primary",
                    )}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-12">
            {campaignsQuery.isLoading ? (
              <div
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                role="status"
                aria-live="polite"
                aria-label="Loading campaigns"
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[22rem] animate-pulse rounded-2xl border border-border bg-card/60"
                  />
                ))}
              </div>
            ) : campaignsQuery.isError ? (
              <CampaignEmptyState
                title="Campaigns could not be loaded"
                description="Please check your connection and try again shortly."
              />
            ) : campaigns.length === 0 ? (
              <CampaignEmptyState title="No campaigns currently" />
            ) : filteredCampaigns.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCampaigns.map((campaign) => (
                  <CampaignListCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <CampaignEmptyState
                title="No campaigns found"
                description="Try a different search term or select another campaign status."
              />
            )}
          </div>
        </div>
      </section>
    </>
  );
}
