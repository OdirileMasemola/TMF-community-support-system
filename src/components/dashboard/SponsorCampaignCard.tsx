import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import type { CampaignToSponsor } from "@/data/sponsorDashboardData";

type SponsorCampaignCardProps = {
  campaign: CampaignToSponsor;
};

export function SponsorCampaignCard({ campaign }: SponsorCampaignCardProps) {
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
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">{campaign.category}</p>
          <h3 className="mt-1 text-base font-semibold text-foreground">{campaign.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{campaign.description}</p>
        </div>

        <p className="text-sm">
          <span className="text-muted-foreground">Funding goal:</span>{" "}
          <span className="font-medium text-foreground">{campaign.fundingGoal}</span>
        </p>

        <Button
          type="button"
          size="sm"
          className="w-full"
          onClick={() =>
            toast.message("Sponsorship enquiry coming soon", {
              description: `You will be able to start sponsoring ${campaign.title} in a later update.`,
            })
          }
        >
          Sponsor this campaign
        </Button>
      </div>
    </article>
  );
}
