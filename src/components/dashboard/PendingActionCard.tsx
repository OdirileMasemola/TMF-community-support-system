import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Priority } from "@/data/adminDashboardData";

type PendingActionCardProps = {
  title: string;
  count: number;
  priority: Priority;
};

const priorityStyles: Record<Priority, string> = {
  High: "border-primary/40 bg-primary/10 text-primary",
  Medium: "border-border bg-muted text-muted-foreground",
  Low: "border-border bg-accent text-accent-foreground",
};

export function PendingActionCard({ title, count, priority }: PendingActionCardProps) {
  return (
    <Card className="flex h-full flex-col bg-card/70 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span
          className={cn(
            "inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            priorityStyles[priority],
          )}
        >
          {priority}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold text-card-foreground">{count}</p>
      <p className="mt-1 text-sm text-muted-foreground">Pending items</p>

      <div className="mt-auto pt-5">
        <Button type="button" variant="outline" size="sm" className="w-full" aria-label={`Open ${title}`}>
          Open
        </Button>
      </div>
    </Card>
  );
}
