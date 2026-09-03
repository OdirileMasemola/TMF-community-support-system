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
  tertiaryCta?: {
    text: string;
    to: string;
  };
  children?: ReactNode;
  compact?: boolean;
};

export function PageHero({
  label,
  title,
  highlightedTitle,
  subtitle,
  primaryCta,
  secondaryCta,
  tertiaryCta,
  children,
  compact = false,
}: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-transparent px-6",
        compact ? "pb-10 pt-28 md:pb-12 md:pt-32" : "pb-16 pt-32 md:pb-20 md:pt-40",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,var(--hero-glow),transparent_70%)]"
      />

      <div className="mx-auto max-w-5xl text-center">
        <AnimatedGroup>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{label}</p>

          <h1
            className={cn(
              "mx-auto max-w-3xl text-balance font-bold text-foreground",
              compact ? "mt-4 text-3xl md:text-4xl lg:text-5xl" : "mt-6 text-4xl md:text-5xl lg:text-6xl",
            )}
          >
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

          <p
            className={cn(
              "mx-auto max-w-2xl text-pretty leading-relaxed text-muted-foreground",
              compact ? "mt-4 text-sm md:text-base" : "mt-6 text-base md:text-lg",
            )}
          >
            {subtitle}
          </p>

          {(primaryCta || secondaryCta || tertiaryCta) && (
            <div className={cn("flex flex-wrap items-center justify-center gap-2.5", compact ? "mt-6" : "mt-10")}>
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
              {tertiaryCta && (
                <Button
                  to={tertiaryCta.to}
                  variant="secondary"
                  className={cn("rounded-lg px-3.5 py-1.5 text-sm")}
                >
                  {tertiaryCta.text}
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
