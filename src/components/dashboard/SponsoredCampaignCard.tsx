import { Button } from "@/components/ui/Button";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { SponsoredCampaign } from "@/data/sponsorDashboardData";
import { cn } from "@/lib/utils";

function CampaignStatusBadge({ status }: { status: SponsoredCampaign["status"] }) {
  const tone =
    status === "Active"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : status === "Upcoming"
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground";

  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tone)}>{status}</span>;
}

type SponsoredCampaignCardProps = {
  campaign: SponsoredCampaign;
};

export function SponsoredCampaignCard({ campaign }: SponsoredCampaignCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card/70 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <OptimizedImage
          src={campaign.image}
          alt={campaign.title}
          className="size-full object-cover"
        />
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">{campaign.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{campaign.category}</p>
          </div>
          <CampaignStatusBadge status={campaign.status} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Support:</span>{" "}
            <span className="font-medium text-foreground">{campaign.supportAmount}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Dates:</span>{" "}
            <span className="font-medium text-foreground">
              {campaign.startDate} – {campaign.endDate}
            </span>
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Campaign progress</span>
            <span>{campaign.progress}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${campaign.progress}%` }} />
          </div>
        </div>

        <Button to="/sponsor/dashboard" variant="outline" size="sm" className="w-full">
          View Campaign
        </Button>
      </div>
    </article>
  );
}
