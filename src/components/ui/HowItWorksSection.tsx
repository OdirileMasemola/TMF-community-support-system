import type { ReactNode } from "react";
import { howItWorksSteps } from "@/data/publicHomeData";

type StepCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  benefits: string[];
};

function StepCard({ icon, title, description, benefits }: StepCardProps) {
  return (
    <div className="relative rounded-2xl border border-border bg-card/70 p-6 text-card-foreground backdrop-blur-xl transition-all duration-300 ease-in-out hover:scale-[1.03] hover:border-primary/50 hover:bg-muted/70 hover:shadow-lg">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>

      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>

      <ul className="mt-5 space-y-3">
        {benefits.map((benefit) => (
          <li key={benefit} className="flex items-start gap-3 text-sm text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span className="leading-6">{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HowItWorksSection() {
  return (
    <section className="relative bg-transparent py-16 md:py-24" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            How the system works
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-3 text-2xl font-bold text-foreground md:text-3xl lg:text-4xl"
          >
            Simple steps to access community support.
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            The platform helps volunteers, donors, sponsors, and beneficiaries connect with the foundation through one organised digital system.
          </p>
        </div>

        <div className="relative mt-12">
          <div
            className="absolute left-0 right-0 top-5 hidden h-px bg-border lg:block"
            aria-hidden="true"
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {howItWorksSteps.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.step} className="relative">
                  <div className="mb-6 flex justify-center">
                    <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-foreground shadow-sm">
                      {step.step}
                    </div>
                  </div>

                  <StepCard
                    icon={<Icon className="h-6 w-6" />}
                    title={step.title}
                    description={step.description}
                    benefits={step.benefits}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}