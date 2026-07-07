import type { ReactNode } from "react";
import { AnimatedGroup } from "@/components/ui/AnimatedGroup";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type PageHeroProps = {
  label: string;
  title: string;
  highlightedTitle?: string;
  subtitle: string;
  primaryCta?: {
    text: string;
    to: string;
  };
  secondaryCta?: {
    text: string;
    to: string;
  };
  children?: ReactNode;
};

export function PageHero({
  label,
  title,
  highlightedTitle,
  subtitle,
  primaryCta,
  secondaryCta,
  children,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-transparent px-6 pb-16 pt-32 md:pb-20 md:pt-40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,var(--hero-glow),transparent_70%)]"
      />

      <div className="mx-auto max-w-5xl text-center">
        <AnimatedGroup>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{label}</p>

          <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
            {title}
            {highlightedTitle ? (
              <>
                {" "}
                <span className="bg-[image:var(--hero-highlight-gradient)] bg-clip-text text-transparent">
                  {highlightedTitle}
                </span>
              </>
            ) : null}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            {subtitle}
          </p>

          {(primaryCta || secondaryCta) && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
              {primaryCta && (
                <div className="rounded-xl border border-border bg-foreground/5 p-0.5">
                  <Button to={primaryCta.to} className="rounded-lg px-3.5 py-1.5 text-sm">
                    {primaryCta.text}
                  </Button>
                </div>
              )}
              {secondaryCta && (
                <Button
                  to={secondaryCta.to}
                  variant="outline"
                  className={cn("rounded-lg px-3.5 py-1.5 text-sm")}
                >
                  {secondaryCta.text}
                </Button>
              )}
            </div>
          )}
        </AnimatedGroup>

        {children}
      </div>
    </section>
  );
}
