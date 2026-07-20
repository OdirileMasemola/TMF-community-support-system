"use client";

import { useId } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { formatDate } from "@/lib/formater";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Delta, DeltaIcon, DeltaValue } from "@/components/efferd/delta";
import { DashboardCard } from "@/components/efferd/dashboard-card";

const chartData = [
  { date: "2026-07-14", campaigns: 12, volunteers: 8 },
  { date: "2026-07-15", campaigns: 11, volunteers: 9 },
  { date: "2026-07-16", campaigns: 13, volunteers: 10 },
  { date: "2026-07-17", campaigns: 12, volunteers: 11 },
  { date: "2026-07-18", campaigns: 14, volunteers: 12 },
  { date: "2026-07-19", campaigns: 13, volunteers: 13 },
  { date: "2026-07-20", campaigns: 14, volunteers: 15 },
];

const growthPct = 8.4;

const chartConfig = {
  campaigns: { label: "Campaigns", color: "var(--chart-2)" },
  volunteers: { label: "Volunteers", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ProgrammeActivityChart({ className }: { className?: string }) {
  const chartUid = useId().replace(/:/g, "");
  const idLineGlow = `programme-line-glow-${chartUid}`;

  return (
    <DashboardCard className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Programme activity</CardTitle>
            <CardDescription>Active campaigns and volunteer engagement, last 7 days.</CardDescription>
          </div>
          <Delta value={growthPct} variant="badge">
            <DeltaIcon variant="trend" />
            <DeltaValue />
          </Delta>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer className="aspect-auto h-60 w-full md:h-72" config={chartConfig}>
          <LineChart data={chartData} margin={{ left: 12, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              axisLine={false}
              dataKey="date"
              tickFormatter={(value) => formatDate(String(value), "day-month")}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
            <defs>
              <filter height="140%" id={idLineGlow} width="140%" x="-20%" y="-20%">
                <feGaussianBlur result="blur" stdDeviation="2" />
              </filter>
            </defs>
            <Line
              dataKey="volunteers"
              dot={false}
              filter={`url(#${idLineGlow})`}
              stroke="var(--color-volunteers)"
              strokeWidth={2}
              type="monotone"
            />
            <Line
              dataKey="campaigns"
              dot={false}
              filter={`url(#${idLineGlow})`}
              stroke="var(--color-campaigns)"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </DashboardCard>
  );
}
