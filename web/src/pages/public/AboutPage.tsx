import AboutHero from "@/components/blocks/hero-about";
import OurJourneyTimeline from "@/components/blocks/our-journey-timeline";
import { CallToActionSection } from "@/components/ui/CallToActionSection";
import { SectionReveal } from "@/components/ui/SectionReveal";

export function AboutPage() {
  return (
    <>
      <AboutHero />
      <SectionReveal delay={0.08} direction="up">
        <OurJourneyTimeline />
      </SectionReveal>
      <SectionReveal delay={0.12} direction="up">
        <CallToActionSection />
      </SectionReveal>
    </>
  );
}
