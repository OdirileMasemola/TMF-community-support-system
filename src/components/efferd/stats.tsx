import { CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { dashboardStatistics } from "@/data/adminDashboardData";
import { Delta, DeltaIcon, DeltaValue } from "@/components/efferd/delta";
import { DashboardCard } from "@/components/efferd/dashboard-card";

const stats = dashboardStatistics.slice(0, 4).map((stat, index) => ({
  label: stat.title,
  value: String(stat.value),
  delta: [12, 3, 18, 5][index] ?? 0,
}));

export function DashboardStats() {
  return (
    <>
      {stats.map((stat) => (
        <DashboardCard key={stat.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
          </CardContent>
          <CardFooter className="pt-0 text-xs text-muted-foreground">
            <Delta value={stat.delta}>
              <DeltaIcon />
              <DeltaValue />
            </Delta>
            <span className="ml-1">vs last month</span>
          </CardFooter>
        </DashboardCard>
      ))}
    </>
  );
}
