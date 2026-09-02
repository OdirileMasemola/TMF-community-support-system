import {
  GetInvolvedCtaSection,
  ResourceSupportSection,
  SupportCampaignsSection,
  VolunteeringSection,
  WaysToGetInvolvedSection,
  WhyGetInvolvedSection,
} from "@/components/blocks/get-involved-sections";
import { PageHero } from "@/components/ui/PageHero";
import { SectionReveal } from "@/components/ui/SectionReveal";

export function GetInvolvedPage() {
  return (
    <main className="min-h-screen">
      <PageHero
        label="GET INVOLVED"
        title="Be part of"
        highlightedTitle="the change."
        subtitle="There are many ways to support the Themba Molefe Foundation. Whether you volunteer your time, support a campaign, make a donation, or help provide resources to communities, your contribution can make a meaningful difference."
        primaryCta={{ text: "Become a Volunteer", to: "/register" }}
        secondaryCta={{ text: "Explore Campaigns", to: "/campaigns" }}
      />

      <SectionReveal delay={0.05} direction="up">
        <WaysToGetInvolvedSection />
      </SectionReveal>

      <SectionReveal delay={0.08} direction="up">
        <VolunteeringSection />
      </SectionReveal>

      <SectionReveal delay={0.1} direction="up">
        <SupportCampaignsSection />
      </SectionReveal>

      <SectionReveal delay={0.12} direction="up">
        <ResourceSupportSection />
      </SectionReveal>

      <SectionReveal delay={0.14} direction="up">
        <WhyGetInvolvedSection />
      </SectionReveal>

      <SectionReveal delay={0.16} direction="up">
        <GetInvolvedCtaSection />
      </SectionReveal>
    </main>
  );
}
