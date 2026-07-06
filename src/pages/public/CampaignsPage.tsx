import { CampaignHeroPreview } from "@/components/ui/CampaignHeroPreview";
import { PageHero } from "@/components/ui/PageHero";

export function CampaignsPage() {
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

      <section id="campaign-list" className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          {/* Campaign filters and cards will be added next. */}
        </div>
      </section>
    </>
  );
}
