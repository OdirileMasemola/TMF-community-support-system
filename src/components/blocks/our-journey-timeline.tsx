import type { ReactElement } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/Card";

type Milestone = {
  id: number;
  title: string;
  date?: string;
  description?: string;
};

const milestones: Milestone[] = [
  {
    id: 1,
    title: "Foundation Established",
    date: "01 February 2015",
    description:
      "The Themba Molefe Foundation began as a community organisation in Nhlapo section, Katlehong, focused on improving the lives of vulnerable families through practical local support.",
  },
  {
    id: 2,
    title: "First Community Programme",
    date: "25 December 2015",
    description:
      "The first outreach created a day of care, joy, and support for underprivileged children and child-headed households, setting the tone for future programmes.",
  },
  {
    id: 3,
    title: "Expanded Volunteer Network",
    date: "01 February 2016",
    description:
      "The foundation strengthened its volunteer framework to deliver household assistance, emotional support, and essential services more consistently.",
  },
];

export function OurJourneyTimeline(): ReactElement {
  return (
    <section id="our-journey" className="scroll-mt-28 px-6 pb-24 pt-10 md:pb-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Our Journey
          </p>
          <h2 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">
            Growing through community action.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
            A few key moments from the foundation's early work and continued commitment to
            vulnerable communities.
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-3xl">
          <div
            aria-hidden="true"
            className="absolute bottom-10 left-[1.1rem] top-5 w-px bg-gradient-to-b from-primary via-border to-transparent"
          />
          {milestones.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="relative pb-10 pl-14 last:pb-0"
            >
              <div className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-background shadow-sm">
                <span className="h-3 w-3 rounded-full bg-primary" />
              </div>

              <Card className="border-border/70 bg-card/60 p-0 shadow-sm backdrop-blur transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-foreground">{entry.title}</h3>
                    {entry.date ? (
                      <p className="text-sm font-medium text-primary">{entry.date}</p>
                    ) : null}
                  </div>

                  <p className="mt-4 leading-7 text-muted-foreground">
                    {entry.description ?? "Description to be provided."}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default OurJourneyTimeline;
