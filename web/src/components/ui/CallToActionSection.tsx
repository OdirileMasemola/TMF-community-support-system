import { HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type CallToActionSectionProps = {
  badge?: string;
  heading?: string;
  description?: string;
  primaryCta?: {
    text: string;
    to: string;
  };
  secondaryCta?: {
    text: string;
    to: string;
  };
  footerText?: string;
  compact?: boolean;
};

export function CallToActionSection({
  badge = "Join the TMF support community",
  heading = "Ready to make a difference?",
  description = "Create an account and help the Themba Molefe Foundation manage campaigns, donations, sponsorships, volunteers, and assistance requests in one organised platform.",
  primaryCta = { text: "Create Account", to: "/register" },
  secondaryCta = { text: "Make a Donation", to: "/donate" },
  footerText = "Whether you want to volunteer, donate, sponsor, or request support, the platform guides you to the right place.",
  compact = false,
}: CallToActionSectionProps) {
  return (
    <section
      className={cn("relative bg-transparent", compact ? "py-10 md:py-12" : "py-16 md:py-24")}
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div
          className={cn(
            "relative mx-auto flex max-w-5xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-border bg-card/70 text-center text-card-foreground shadow-lg backdrop-blur-xl",
            compact ? "px-5 py-10 md:px-8 md:py-12" : "px-6 py-14 md:px-10 md:py-16",
          )}
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--cta-gradient-start), var(--cta-gradient-end))",
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--cta-glow),transparent_45%)] opacity-60"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(99,159,171,0.12),transparent_50%)] opacity-70"
          />

          <span
            className={cn(
              "relative z-10 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 font-medium text-muted-foreground backdrop-blur",
              compact ? "mb-4 px-3.5 py-1.5 text-xs" : "mb-5 px-4 py-2 text-sm",
            )}
          >
            <HeartHandshake className="h-4 w-4 text-primary" aria-hidden="true" />
            {badge}
          </span>

          <h2
            id="cta-heading"
            className={cn(
              "relative z-10 max-w-3xl font-bold tracking-tight text-foreground",
              compact ? "text-2xl sm:text-3xl md:text-4xl" : "text-3xl sm:text-4xl md:text-5xl",
            )}
          >
            {heading}
          </h2>

          <p
            className={cn(
              "relative z-10 max-w-2xl leading-relaxed text-muted-foreground",
              compact ? "mt-3 text-sm md:text-base" : "mt-5 text-base md:text-lg",
            )}
          >
            {description}
          </p>

          <div className={cn("relative z-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row", compact ? "mt-5" : "mt-8")}>
            <Button to={primaryCta.to}>{primaryCta.text}</Button>
            <Button to={secondaryCta.to} variant="outline">
              {secondaryCta.text}
            </Button>
          </div>

          <p className={cn("relative z-10 max-w-xl text-sm leading-relaxed text-muted-foreground", compact ? "mt-4" : "mt-6")}>
            {footerText}
          </p>
        </div>
      </div>
    </section>
  );
}
