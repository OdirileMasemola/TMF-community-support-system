import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { CampaignEmptyState } from "@/components/ui/CampaignEmptyState";
import { CampaignListCard } from "@/components/ui/CampaignListCard";
import { CallToActionSection } from "@/components/ui/CallToActionSection";
import {
  impactPoints,
  involvementOptions,
  resourceExamples,
  volunteerAreas,
} from "@/data/getInvolvedData";
import { resolveCampaignImage } from "@/lib/campaignImages";
import { campaignStatusLabel, formatCurrency, formatShortDate } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { fetchCampaigns } from "@/services/campaigns";
import type { Campaign, CampaignStatus } from "@/types/public";

const sectionClassName = "relative bg-transparent py-16 md:py-20";

function SectionIntro({
  id,
  label,
  heading,
  paragraph,
  align = "left",
}: {
  id?: string;
  label?: string;
  heading: string;
  paragraph: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {label ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{label}</p>
      ) : null}
      <h2 id={id} className="mt-3 text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">
        {heading}
      </h2>
      <p className="mt-4 leading-relaxed text-muted-foreground">{paragraph}</p>
    </div>
  );
}

function InvolvementCard({
  title,
  description,
  icon: Icon,
  buttonText,
  buttonTo,
}: (typeof involvementOptions)[number]) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-border bg-card/70 p-6 text-card-foreground backdrop-blur-xl transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground">{description}</p>
      <Button to={buttonTo} variant="outline" className="mt-5 w-fit">
        {buttonText}
      </Button>
    </article>
  );
}

function mapPublicCampaignStatus(status: string): CampaignStatus {
  const label = campaignStatusLabel(status);
  if (label === "Active") return "Active";
  if (label === "Draft") return "Upcoming";
  return "Completed";
}

export function WaysToGetInvolvedSection() {
  return (
    <section className={sectionClassName} aria-labelledby="ways-to-get-involved-heading">
      <div className="mx-auto max-w-6xl px-6">
        <SectionIntro
          id="ways-to-get-involved-heading"
          heading="How You Can Get Involved"
          paragraph="Everyone can contribute in different ways. Choose the form of support that best matches your interests, resources, and availability."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {involvementOptions.map((option) => (
            <InvolvementCard key={option.title} {...option} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function VolunteeringSection() {
  return (
    <section
      id="volunteer"
      className={sectionClassName}
      aria-labelledby="volunteering-heading"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionIntro
          id="volunteering-heading"
          heading="Volunteer With TMF"
          paragraph="Volunteers play an important role in helping the foundation organise campaigns, reach communities, distribute support, and assist with community activities."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {volunteerAreas.map((area) => (
            <div
              key={area.title}
              className="rounded-2xl border border-border bg-card/70 p-6 text-card-foreground backdrop-blur-xl transition-all duration-300 hover:border-primary/50"
            >
              <h3 className="text-lg font-semibold text-foreground">{area.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{area.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button to="/register">Apply to Volunteer</Button>
        </div>
      </div>
    </section>
  );
}

export function SupportCampaignsSection() {
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

  const previewCampaigns = campaigns.slice(0, 3);

  return (
    <section className={sectionClassName} aria-labelledby="support-campaigns-heading">
      <div className="mx-auto max-w-6xl px-6">
        <SectionIntro
          id="support-campaigns-heading"
          heading="Sponsor a Campaign"
          paragraph="Our campaigns turn community support into practical assistance. Explore current initiatives and choose a campaign you would like to support."
        />

        <div className="mt-12">
          {campaignsQuery.isLoading ? (
            <p className="text-center text-sm text-muted-foreground">Loading campaigns...</p>
          ) : campaignsQuery.isError ? (
            <CampaignEmptyState />
          ) : campaigns.length === 0 ? (
            <CampaignEmptyState />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {previewCampaigns.map((campaign) => (
                <CampaignListCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <Button to="/campaigns" variant="outline">
            View All Campaigns
          </Button>
        </div>
      </div>
    </section>
  );
}

export function ResourceSupportSection() {
  return (
    <section className={sectionClassName} aria-labelledby="resource-support-heading">
      <div className="mx-auto max-w-6xl px-6">
        <SectionIntro
          id="resource-support-heading"
          heading="Support With Resources"
          paragraph="Not every contribution has to be financial. The foundation can also benefit from practical resources that help support community members and foundation programmes."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resourceExamples.map((resource) => {
            const Icon = resource.icon;

            return (
              <div
                key={resource.label}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card/70 p-5 text-card-foreground backdrop-blur-xl transition-all duration-300 hover:border-primary/50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-foreground">{resource.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Button to="/contact">Contact Foundation</Button>
        </div>
      </div>
    </section>
  );
}

export function WhyGetInvolvedSection() {
  return (
    <section className={sectionClassName} aria-labelledby="why-get-involved-heading">
      <div className="mx-auto max-w-6xl px-6">
        <SectionIntro
          id="why-get-involved-heading"
          heading="Why Your Support Matters"
          paragraph="Every contribution strengthens the foundation's ability to serve communities with care, consistency, and practical support."
          align="center"
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {impactPoints.map((point) => {
            const Icon = point.icon;

            return (
              <div
                key={point.title}
                className="rounded-2xl border border-border bg-card/70 p-6 text-card-foreground backdrop-blur-xl transition-all duration-300 hover:border-primary/50"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{point.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{point.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function GetInvolvedCtaSection() {
  return (
    <CallToActionSection
      badge="Get involved with TMF"
      heading="Ready to Make a Difference?"
      description="Whether you give your time, donate, support a campaign, or provide resources, your contribution can help the Themba Molefe Foundation continue supporting communities."
      primaryCta={{ text: "Become a Volunteer", to: "/register" }}
      secondaryCta={{ text: "Support a Campaign", to: "/campaigns" }}
      footerText="Choose the path that works best for you and start making an impact today."
    />
  );
}
