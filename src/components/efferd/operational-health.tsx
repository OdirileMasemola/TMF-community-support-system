import { ArrowRight, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { DashboardCard } from "@/components/efferd/dashboard-card";

export function OperationalHealth({ className }: { className?: string }) {
  return (
    <DashboardCard className={className}>
      <CardHeader>
        <CardTitle>Operational health</CardTitle>
        <CardDescription>Nothing urgent needs your attention.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CircleCheck className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-medium text-foreground">You&apos;re caught up.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Campaigns, donations, and volunteer reviews look fine in this snapshot.
          </p>
        </div>
        <Button type="button" variant="link" size="sm" className="h-auto px-0">
          Review pending items
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </CardContent>
    </DashboardCard>
  );
}
