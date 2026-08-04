import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { recentActivities } from "@/data/adminDashboardData";
import { DashboardCard } from "@/components/efferd/dashboard-card";

export function DashboardActivity({ className }: { className?: string }) {
  return (
    <DashboardCard className={className}>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Latest updates across the foundation workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {recentActivities.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.timestamp}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </DashboardCard>
  );
}
