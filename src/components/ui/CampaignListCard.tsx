import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Tag, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/types/public";

type CampaignListCardProps = {
  campaign: Campaign;
  className?: string;
};

function getStatusBadgeClasses(status: Campaign["status"]) {
  switch (status) {
    case "Active":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-300";
    case "Upcoming":
      return "border-cyan-500/40 bg-cyan-500/15 text-cyan-700 dark:border-cyan-400/50 dark:text-cyan-300";
    case "Completed":
      return "border-zinc-500/40 bg-zinc-500/15 text-zinc-700 dark:border-zinc-400/50 dark:text-zinc-300";
    default:
      return "border-border bg-background/70 text-muted-foreground";
  }
}

export function CampaignListCard({ campaign, className }: CampaignListCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4 }}
      className={cn("w-full", className)}
    >
      <Card className="group relative h-full overflow-hidden rounded-2xl border-border/50 bg-card/30 p-0 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={campaign.image}
            alt={campaign.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />

          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/50 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
              <Tag className="h-3 w-3" aria-hidden="true" />
              {campaign.category}
            </span>
            <span
              className={cn(
                "inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur",
                getStatusBadgeClasses(campaign.status),
              )}
            >
              {campaign.status}
            </span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center bg-background/20 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
            <Link
              to="/campaigns"
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              View Details
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
              {campaign.title}
            </h3>
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
              {campaign.description}
            </p>
          </div>

          <div className="grid gap-3 border-t border-border/50 pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>Starts: {campaign.startDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>Ends: {campaign.endDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{campaign.goal}</span>
            </div>
          </div>

          <Link
            to="/campaigns"
            className="mt-2 inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary transition-all duration-200 hover:gap-3"
          >
            View Details
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
