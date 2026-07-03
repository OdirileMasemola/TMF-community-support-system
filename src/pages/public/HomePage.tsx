import { HeroSection } from "@/components/ui/HeroSection";
import { StatsSection } from "@/components/ui/StatsSection";
import { FeaturedCampaignsSection } from "@/components/ui/FeaturedCampaignsSection";
import { HowItWorksSection } from "@/components/ui/HowItWorksSection";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";

import heroImage from "@/assets/hero.JPG";

export function HomePage() {
  return (
    <>
      <HeroSection
        slogan="COMMUNITY SUPPORT MANAGEMENT"
        title="Supporting Communities"
        highlightedTitle="Through Better Care"
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

      <StatsSection />

      <FeaturedCampaignsSection />

      <HowItWorksSection />

      {/* About Preview */}
      <section className="relative mx-auto max-w-6xl bg-transparent px-4 py-16 md:px-6">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <SectionHeader title="About the Foundation" />
          <div>
            <p className="leading-relaxed text-muted-foreground">
              The Themba Molefe Foundation supports vulnerable communities through outreach
              programmes, donations, sponsorships, volunteer participation, and beneficiary
              assistance. This system helps organise and track community support activities in one
              central platform.
            </p>
            <div className="mt-6">
              <Button to="/about" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative mx-auto max-w-6xl bg-transparent px-4 py-16 text-center md:px-6">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">Ready to make a difference?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Join the platform and help the foundation manage community support in a more organised
          and transparent way.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/register">Create Account</Button>
          <Button to="/donate" variant="outline">
            Make a Donation
          </Button>
        </div>
      </section>
    </>
  );
}
