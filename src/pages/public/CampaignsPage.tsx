import { useMemo, useState } from "react";
import { AnimatedGlowingSearchBar } from "@/components/ui/AnimatedGlowingSearchBar";
import { Button } from "@/components/ui/Button";
import { CampaignHeroPreview } from "@/components/ui/CampaignHeroPreview";
import { PageHero } from "@/components/ui/PageHero";
import { cn } from "@/lib/utils";

type CampaignStatus = "Active" | "Upcoming" | "Completed";
type CampaignFilter = "All" | CampaignStatus;

type Campaign = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  goal: string;
};

const filters: CampaignFilter[] = ["All", "Active", "Upcoming", "Completed"];

const campaigns: Campaign[] = [
  {
    id: "food-support-drive",
    title: "Food Support Drive",
    description: "Providing food parcels and basic support to families facing difficult living conditions.",
    category: "Food Support",
    status: "Active",
    startDate: "01 July 2026",
    endDate: "31 July 2026",
    goal: "Support 100 families",
  },
  {
    id: "youth-education-support",
    title: "Youth Education Support",
    description: "Helping learners with school resources, mentorship, and academic support.",
    category: "Education",
    status: "Active",
    startDate: "15 July 2026",
    endDate: "30 August 2026",
    goal: "Assist 80 learners",
  },
  {
    id: "winter-relief-campaign",
    title: "Winter Relief Campaign",
    description: "Collecting warm clothing and essentials for vulnerable families during winter.",
    category: "Relief Support",
    status: "Upcoming",
    startDate: "01 August 2026",
    endDate: "31 August 2026",
    goal: "Collect 300 clothing items",
  },
  {
    id: "community-health-awareness",
    title: "Community Health Awareness",
    description: "Promoting health awareness and basic wellness information within the community.",
    category: "Health Awareness",
    status: "Upcoming",
    startDate: "10 August 2026",
    endDate: "20 August 2026",
    goal: "Reach 200 community members",
  },
  {
    id: "back-to-school-drive",
    title: "Back To School Drive",
    description: "Supporting school learners with stationery, school bags, and learning materials.",
    category: "Education",
    status: "Completed",
    startDate: "01 January 2026",
    endDate: "31 January 2026",
    goal: "Support 120 learners",
  },
  {
    id: "family-care-support",
    title: "Family Care Support",
    description: "Helping families with basic household support and community care resources.",
    category: "Family Support",
    status: "Completed",
    startDate: "01 May 2026",
    endDate: "31 May 2026",
    goal: "Support 60 families",
  },
];

const statusBadgeClasses: Record<CampaignStatus, string> = {
  Active:
    "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-300",
  Upcoming:
    "border-cyan-500/40 bg-cyan-500/15 text-cyan-700 dark:border-cyan-400/50 dark:text-cyan-300",
  Completed:
    "border-zinc-500/40 bg-zinc-500/15 text-zinc-700 dark:border-zinc-400/50 dark:text-zinc-300",
};

function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card/70 text-card-foreground shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
      <div className="h-36 bg-[radial-gradient(circle_at_top_left,rgba(99,159,171,0.35),transparent_38%),linear-gradient(135deg,rgba(28,93,153,0.24),rgba(99,159,171,0.1))]" />

      <div className="flex flex-1 flex-col p-6">
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur",
            statusBadgeClasses[campaign.status],
          )}
        >
          {campaign.status}
        </span>

        <h3 className="mt-5 text-xl font-bold text-foreground">{campaign.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">{campaign.description}</p>

        <dl className="mt-6 grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
            <dt className="text-muted-foreground">Category</dt>
            <dd className="font-medium text-foreground">{campaign.category}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Starts</dt>
            <dd className="font-medium text-foreground">{campaign.startDate}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Ends</dt>
            <dd className="font-medium text-foreground">{campaign.endDate}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Goal</dt>
            <dd className="font-medium text-foreground">{campaign.goal}</dd>
          </div>
        </dl>

        <Button to="/campaigns" className="mt-6 w-fit">
          View Details
        </Button>
      </div>
    </article>
  );
}

export function CampaignsPage() {
  const [activeFilter, setActiveFilter] = useState<CampaignFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCampaigns = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesFilter = activeFilter === "All" || campaign.status === activeFilter;
      const searchableContent = [
        campaign.title,
        campaign.description,
        campaign.category,
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && searchableContent.includes(normalizedSearchQuery);
    });
  }, [activeFilter, searchQuery]);

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

          {filteredCampaigns.length > 0 ? (
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-border bg-card/70 p-8 text-center text-card-foreground backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-foreground">No campaigns found</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Try a different search term or select another campaign status.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
