import type { ReactElement } from "react";
import { Button } from "@/components/ui/Button";
import OurJourneyTimeline from "@/components/blocks/our-journey-timeline";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import aboutCommunityImage from "@/assets/images/about/DSC_0632.jpeg";
import familyCareImage from "@/assets/images/campaigns/Family Care Support.webp";
import foodSupportImage from "@/assets/images/campaigns/Food Support Drive.webp";

export function AboutHero(): ReactElement {
  return (
    <main className="pt-24">
      <section className="bg-white dark:bg-transparent">
        <div className="mx-auto max-w-5xl px-6 py-28 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            About TMF
          </p>

          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
            About The Themba Molefe{" "}
            <span className="bg-[image:var(--hero-highlight-gradient)] bg-clip-text text-transparent">
              Foundation
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            We partner with local communities to create lasting educational and economic
            opportunities, empowering people through programmes, mentorship, and direct support.
          </p>

          <div className="mt-10 flex justify-center">
            <Button
              className="rounded-lg px-3.5 py-1.5 text-sm"
              onClick={() =>
                document.getElementById("our-journey")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Learn More
            </Button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 px-6 pb-24 md:grid-cols-3">
            <OptimizedImage
              src={aboutCommunityImage}
              alt="Themba Molefe Foundation community gathering"
              className="h-56 w-full rounded-lg object-cover"
            />
            <OptimizedImage
              src={familyCareImage}
              alt="Family care support in the community"
              className="h-56 w-full rounded-lg object-cover"
            />
            <OptimizedImage
              src={foodSupportImage}
              alt="Food support drive with volunteers"
              className="h-56 w-full rounded-lg object-cover"
            />
          </div>
        </div>
      </section>

      <OurJourneyTimeline />
    </main>
  );
}

export default AboutHero;
