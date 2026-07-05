import { HeroSection } from "@/components/ui/HeroSection";
import { StatsSection } from "@/components/ui/StatsSection";
import { FeaturedCampaignsSection } from "@/components/ui/FeaturedCampaignsSection";
import { HowItWorksSection } from "@/components/ui/HowItWorksSection";
import { CallToActionSection } from "@/components/ui/CallToActionSection";
import { SectionReveal } from "@/components/ui/SectionReveal";

import heroImage from "@/assets/hero.JPG";

export function HomePage() {
  return (
    <>
      <HeroSection
        slogan="THEMBA MOLEFE FOUNDATION"
        title="Tomorrow is"
        highlightedTitle="one dream away"
        subtitle="A digital platform for managing campaigns, donations, volunteers, sponsors, and assistance requests for the Themba Molefe Foundation."
        primaryCta={{ text: "Get Started", to: "/register" }}
        secondaryCta={{ text: "View Campaigns", to: "/campaigns" }}
        backgroundImage={heroImage}
        contactInfo={{
          website: "tmfsupport.org",
          phone: "+27 72 076 9116",
          address: "Katlehong, Gauteng",
        }}
      />

      <SectionReveal delay={0.05} direction="left">
        <StatsSection />
      </SectionReveal>

      <SectionReveal delay={0.12} direction="right">
        <FeaturedCampaignsSection />
      </SectionReveal>

      <SectionReveal delay={0.18} direction="left">
        <HowItWorksSection />
      </SectionReveal>

      <SectionReveal delay={0.24} direction="up">
        <CallToActionSection />
      </SectionReveal>
    </>
  );
}
