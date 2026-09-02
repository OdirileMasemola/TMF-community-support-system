import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

type CampaignEmptyStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function CampaignEmptyState({
  title = "No campaigns added yet",
  description = "There are no campaigns available at the moment. Please check back later for new foundation initiatives.",
  className,
}: CampaignEmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto max-w-2xl rounded-3xl border border-border bg-card/70 p-10 text-center backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background/60">
        <Megaphone className="h-6 w-6 text-primary" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
