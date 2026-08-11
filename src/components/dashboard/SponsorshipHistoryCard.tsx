import { History } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/Button";
import type { SponsorshipHistoryItem } from "@/data/sponsorDashboardData";

type SponsorshipHistoryCardProps = {
  item: SponsorshipHistoryItem;
};

export function SponsorshipHistoryCard({ item }: SponsorshipHistoryCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-card/70 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <History className="size-5" aria-hidden="true" />
        </span>
        <AdminStatusBadge status={item.status} />
      </div>

      <h3 className="mt-4 text-base font-semibold text-foreground">{item.campaign}</h3>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Contribution</dt>
          <dd className="text-right font-medium text-foreground">{item.contribution}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Date</dt>
          <dd className="font-medium text-foreground">{item.date}</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.impactSummary}</p>

      <div className="mt-auto pt-5">
        <Button to="/sponsor/dashboard" variant="outline" size="sm" className="w-full">
          View Summary
        </Button>
      </div>
    </article>
  );
}
