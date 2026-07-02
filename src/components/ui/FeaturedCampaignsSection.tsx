import { CampaignCard } from "@/components/ui/CampaignCard";
import { Button } from "@/components/ui/Button";
import { featuredCampaigns } from "@/data/publicHomeData";

export function FeaturedCampaignsSection() {
  return (
    <section
      className="relative bg-transparent py-16 md:py-24"
      aria-labelledby="featured-campaigns-heading"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary">FEATURED CAMPAIGNS</p>
          <h2
            id="featured-campaigns-heading"
            className="mt-3 text-2xl font-bold text-foreground md:text-3xl lg:text-4xl"
          >
            Support active community campaigns.
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Explore current and upcoming campaigns managed through the Themba Molefe Foundation&apos;s
            community support platform.
          </p>
        </div>

        <div className="mt-12 grid gap-10 pt-8 pb-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              title={campaign.title}
              description={campaign.description}
              status={campaign.status}
              gradientFrom={campaign.gradientFrom}
              gradientTo={campaign.gradientTo}
              href={campaign.href}
            />
          ))}
        </div>

        <div className="mt-6 text-center">
          <Button to="/campaigns" variant="outline">
            View All Campaigns
          </Button>
        </div>
      </div>
    </section>
  );
}
