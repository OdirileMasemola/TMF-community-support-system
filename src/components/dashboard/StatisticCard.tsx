import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type StatisticCardProps = {
  title: string;
  value: number | string;
  trend: string;
  icon: LucideIcon;
};

export function StatisticCard({ title, value, trend, icon: Icon }: StatisticCardProps) {
  return (
    <Card
      className={cn(
        "bg-card/70 backdrop-blur-xl transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold text-card-foreground md:text-3xl">{value}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{title}</p>
      <p className="mt-2 text-xs text-muted-foreground">{trend}</p>
    </Card>
  );
}
