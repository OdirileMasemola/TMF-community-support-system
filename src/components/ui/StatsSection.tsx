import {
  founderQuote,
  impactStats,
  statsSectionContent,
} from "@/data/publicHomeData";

export function StatsSection() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="stats-section-heading">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-primary">
              {statsSectionContent.label}
            </p>
            <h2
              id="stats-section-heading"
              className="mt-3 text-2xl font-bold text-foreground md:text-3xl lg:text-4xl"
            >
              {statsSectionContent.heading}
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {statsSectionContent.paragraph}
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-4">
              {impactStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm"
                >
                  <dt className="text-2xl font-bold text-primary md:text-3xl">{stat.value}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex items-center">
            <figure className="w-full rounded-2xl border border-border border-l-4 border-l-primary bg-card p-6 text-card-foreground shadow-sm md:p-8">
              <figcaption className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {founderQuote.label}
              </figcaption>
              <div className="mt-3 h-1 w-12 rounded-full bg-primary" aria-hidden="true" />
              <blockquote className="mt-6">
                <p className="text-xl font-medium leading-relaxed text-foreground md:text-2xl">
                  &ldquo;{founderQuote.quote}&rdquo;
                </p>
              </blockquote>
              <p className="mt-6 text-sm text-muted-foreground">{founderQuote.cite}</p>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
