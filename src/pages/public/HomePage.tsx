import { HeroSection } from "@/components/ui/HeroSection";
import { StatsSection } from "@/components/ui/StatsSection";
import { FeaturedCampaignsSection } from "@/components/ui/FeaturedCampaignsSection";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { howItWorksSteps } from "@/data/publicHomeData";

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
          phone: "+27 00 000 0000",
          address: "Katlehong, Gauteng",
        }}
      />

      <StatsSection />

      <FeaturedCampaignsSection />

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

      {/* How It Works */}
      <section className="relative bg-transparent py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <SectionHeader title="How The System Works" align="center" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorksSteps.map((step) => (
              <div
                key={step.step}
                className="rounded-2xl border border-border bg-card p-6 text-card-foreground"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.step}
                </div>
                <h3 className="font-semibold text-card-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
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
