import React from "react";
import { Button } from "@/components/ui/Button";
import OurJourneyTimeline from "@/components/blocks/our-journey-timeline";

export function AboutHero(): JSX.Element {
  return (
    <main className="pt-24">
      <section className="bg-white dark:bg-transparent">
        <div className="mx-auto max-w-5xl px-6 py-28 text-center">
          <h1 className="text-4xl font-semibold md:text-5xl lg:text-6xl">
            About The Themba Molefe Foundation
          </h1>
          <p className="mx-auto my-6 max-w-2xl text-xl text-muted-foreground">
            We partner with local communities to create lasting educational and economic
            opportunities — empowering people through programs, mentorship and direct
            support.
          </p>

          <div className="mt-6 flex justify-center">
            <Button
              size="lg"
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
            <img
              src={"https://source.unsplash.com/900x600/?team,community"}
              alt="Team working together"
              className="h-56 w-full rounded-lg object-cover"
            />
            <img
              src={"https://source.unsplash.com/900x600/?volunteer,helping"}
              alt="Volunteers"
              className="h-56 w-full rounded-lg object-cover"
            />
            <img
              src={"https://source.unsplash.com/900x600/?workspace,office"}
              alt="Workspace"
              className="h-56 w-full rounded-lg object-cover"
            />
          </div>
        </div>
      </section>

      {/* Render timeline on the same page so the Learn More button can scroll to it */}
      <OurJourneyTimeline />
    </main>
  );
}

export default AboutHero;
