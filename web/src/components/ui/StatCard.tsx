import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

type StatCardProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
};

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      {Icon ? (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div>
        <p className="text-2xl font-bold text-card-foreground">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
