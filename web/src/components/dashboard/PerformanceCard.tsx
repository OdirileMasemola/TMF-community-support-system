import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { PerformanceTrend } from "@/data/adminDashboardData";

type PerformanceCardProps = {
  title: string;
  percentage: number;
  description: string;
  trend: PerformanceTrend;
  trendLabel: string;
};

const trendIcons: Record<PerformanceTrend, typeof TrendingUp> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

export function PerformanceCard({
  title,
  percentage,
  description,
  trend,
  trendLabel,
}: PerformanceCardProps) {
  const TrendIcon = trendIcons[trend];

  return (
    <Card className="bg-card/70 backdrop-blur-xl">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-3 text-3xl font-bold text-card-foreground">{percentage}%</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>

      <div
        className={cn(
          "mt-4 inline-flex items-center gap-1.5 text-xs font-medium",
          trend === "up" && "text-primary",
          trend === "down" && "text-muted-foreground",
          trend === "neutral" && "text-muted-foreground",
        )}
      >
        <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{trendLabel}</span>
      </div>
    </Card>
  );
}
