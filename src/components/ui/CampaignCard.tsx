import { Button } from "@/components/ui/Button";
import type { FeaturedCampaign } from "@/types/public";
import { cn } from "@/lib/utils";

type CampaignCardProps = {
  title: string;
  description: string;
  status: FeaturedCampaign["status"];
  gradientFrom: string;
  gradientTo: string;
  glowColor?: string;
  href: string;
};

const gradientPanelClassName = cn(
  "absolute top-8 left-10 h-[280px] w-[55%] rounded-2xl skew-x-[12deg]",
  "motion-safe:transition-all motion-safe:duration-500 motion-reduce:transform-none",
  "motion-safe:group-hover:skew-x-0 motion-safe:group-hover:left-6 motion-safe:group-hover:w-[calc(100%-56px)]",
);

function CampaignStatusBadge({ status }: { status: FeaturedCampaign["status"] }) {
  return (
    <span className="mb-5 inline-flex w-fit rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold text-primary">
      {status}
    </span>
  );
}

function buildGradientStyle(gradientFrom: string, gradientTo: string) {
  return {
    background: `linear-gradient(315deg, ${gradientFrom}, ${gradientTo})`,
  };
}

export function CampaignCard({
  title,
  description,
  status,
  gradientFrom,
  gradientTo,
  glowColor,
  href,
}: CampaignCardProps) {
  const gradientStyle = buildGradientStyle(gradientFrom, gradientTo);
  const glowStyle = {
    ...gradientStyle,
    boxShadow: glowColor ? `0 0 56px 10px ${glowColor}55` : undefined,
  };

  return (
    <article
      className={cn(
        "group relative mx-auto h-[410px] w-full max-w-[340px] overflow-visible py-10",
        "motion-safe:transition-all motion-safe:duration-500 motion-reduce:transition-none",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          gradientPanelClassName,
          "opacity-70 blur-[30px]",
          "motion-safe:group-hover:opacity-90",
        )}
        style={glowStyle}
      />

      <div aria-hidden="true" className={gradientPanelClassName} style={gradientStyle} />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 motion-reduce:hidden"
      >
        <div
          className={cn(
            "absolute left-16 top-10 h-0 w-0 rounded-md border opacity-0 shadow-lg backdrop-blur-md",
            "motion-safe:transition-all motion-safe:duration-500",
            "motion-safe:group-hover:top-6 motion-safe:group-hover:h-12 motion-safe:group-hover:w-12 motion-safe:group-hover:opacity-100",
          )}
          style={{
            borderColor: "rgba(255, 255, 255, 0.18)",
            backgroundColor: "rgba(255, 255, 255, 0.12)",
          }}
        />
        <div
          className={cn(
            "absolute bottom-10 right-16 h-0 w-0 rounded-md border opacity-0 shadow-lg backdrop-blur-md",
            "motion-safe:transition-all motion-safe:duration-500",
            "motion-safe:group-hover:bottom-6 motion-safe:group-hover:h-12 motion-safe:group-hover:w-12 motion-safe:group-hover:opacity-100",
          )}
          style={{
            borderColor: "rgba(255, 255, 255, 0.25)",
            backgroundColor: "rgba(255, 255, 255, 0.18)",
          }}
        />
      </div>

      <div
        className={cn(
          "relative z-20 mt-8 flex h-[280px] flex-col overflow-hidden rounded-2xl border border-border bg-card/70 p-7 shadow-lg backdrop-blur-xl",
          "text-card-foreground motion-safe:transition-all motion-safe:duration-500 motion-reduce:transition-none",
          "motion-safe:group-hover:-translate-x-4 motion-safe:group-hover:-translate-y-2 motion-reduce:transform-none",
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-7 top-0 h-px"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.12)" }}
        />

        <CampaignStatusBadge status={status} />

        <h3 className="text-xl font-bold text-card-foreground">{title}</h3>
        <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>

        <Button to={href} className="mt-4 w-fit">
          View Campaign
        </Button>
      </div>
    </article>
  );
}
