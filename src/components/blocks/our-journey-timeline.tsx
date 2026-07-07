"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/Card";

type Milestone = {
  id: number;
  title: string;
  date?: string;
  description?: string;
};

// Placeholder milestones — replace with real data
const milestones: Milestone[] = [
  { id: 1, title: "Foundation Established", date: "01 February 2015", description: "The Themba Molefe Foundation is a non-profit community organization in Nhlapo section, Katlehong, Gauteng, focuses on improving the lives of vulnerable individuals through community support programs. It collaborates with volunteers, donors, and sponsors to implement campaigns geared toward assisting disadvantaged communities, emphasizing grassroots development and educational outreach, particularly in Katlehong and Thokoza, with a focus on youth and family empowerment." },
  { id: 2, title: "First Community Program", date: "25 December 2015", description: "Our first-ever community outreach, where we spent a day of joy, care and much-needed support for underprivileged children and child-headed households. This initiative kicked off our mission to uplift and shield vulnerable youth and families." },
  { id: 3, title: "Expanded Volunteers", date: "01 February 2016", description: "To deepen our community impact, we have expanded our volunteer framework. This initiative mobilizes and equips trained volunteers to deliver essential services, emotional support, and household assistance directly to the vulnerable youth and child-led families under our care." },
];

export function OurJourneyTimeline(): JSX.Element {
  return (
    <section id="our-journey" className="bg-background py-24">
      <div className="container mx-auto px-6">
        <h2 className="text-foreground mb-12 text-center text-3xl font-semibold">Our Journey</h2>

        <div className="relative mx-auto max-w-3xl">
          {milestones.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="relative mb-12 pl-12"
            >
              <div className="absolute left-2 top-5 h-3 w-3 rounded-full bg-cyan-500 ring-4 ring-background" />

              <h4 className="text-lg font-medium text-foreground">{entry.title}</h4>
              {entry.date ? <p className="mb-2 text-sm text-muted-foreground">{entry.date}</p> : null}

              <Card className="border bg-card shadow-sm hover:shadow-md transition">
                <CardContent className="px-5 py-4">
                  <p className="leading-relaxed text-muted-foreground">
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
