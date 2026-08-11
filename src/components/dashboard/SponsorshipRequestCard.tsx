import { Button } from "@/components/ui/Button";
import type { SponsorshipRequest } from "@/data/sponsorDashboardData";
import { cn } from "@/lib/utils";

function PriorityBadge({ priority }: { priority: SponsorshipRequest["priority"] }) {
  const tone =
    priority === "High"
      ? "bg-destructive/10 text-destructive"
      : priority === "Medium"
        ? "bg-secondary text-secondary-foreground"
        : "bg-primary/10 text-primary";

  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>{priority}</span>;
}

type SponsorshipRequestCardProps = {
  request: SponsorshipRequest;
  onRespond?: (request: SponsorshipRequest) => void;
  isResponding?: boolean;
  hasResponded?: boolean;
};

export function SponsorshipRequestCard({
  request,
  onRespond,
  isResponding,
  hasResponded,
}: SponsorshipRequestCardProps) {
  const Icon = request.icon;

  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-card/70 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <PriorityBadge priority={request.priority} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-foreground">{request.campaign}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{request.category}</p>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Requested support</dt>
          <dd className="text-right font-medium text-foreground">{request.requestedSupport}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Deadline</dt>
          <dd className="font-medium text-foreground">{request.deadline}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Estimated impact</dt>
          <dd className="text-right font-medium text-foreground">{request.estimatedImpact}</dd>
        </div>
      </dl>

      <div className="mt-auto pt-5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={isResponding || hasResponded || !onRespond}
          onClick={() => onRespond?.(request)}
        >
          {hasResponded ? "Response submitted" : isResponding ? "Submitting..." : "Express interest"}
        </Button>
      </div>
    </article>
  );
}
