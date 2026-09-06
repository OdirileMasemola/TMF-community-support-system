"use client";

import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Delta, DeltaIcon, DeltaValue } from "@/components/efferd/delta";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchCampaigns } from "@/services/campaigns";
import { fetchAllApplications } from "@/services/volunteers";

const chartConfig = {
  campaigns: { label: "Campaigns", color: "var(--chart-2)" },
  volunteers: { label: "Volunteers", color: "var(--chart-1)" },
} satisfies ChartConfig;

type ProgrammePoint = {
  date: string;
  campaigns: number;
  volunteers: number;
};

function buildProgrammeSeries(
  campaigns: Awaited<ReturnType<typeof fetchCampaigns>>,
  applications: Awaited<ReturnType<typeof fetchAllApplications>>,
): ProgrammePoint[] {
  const categoryMap = new Map<string, { campaigns: number; volunteers: number }>();

  for (const campaign of campaigns) {
    const category = campaign.category?.trim() || "Uncategorised";
    const current = categoryMap.get(category) ?? { campaigns: 0, volunteers: 0 };
    current.campaigns += 1;
    categoryMap.set(category, current);
  }

  for (const application of applications) {
    const category = application.campaigns?.title?.trim()
      ? campaigns.find((campaign) => campaign.id === application.campaign_id)?.category?.trim() || "Uncategorised"
      : "Uncategorised";
    const current = categoryMap.get(category) ?? { campaigns: 0, volunteers: 0 };
    current.volunteers += 1;
    categoryMap.set(category, current);
  }

  const points = Array.from(categoryMap.entries()).map(([date, counts]) => ({
    date,
    campaigns: counts.campaigns,
    volunteers: counts.volunteers,
  }));

  if (points.length > 0) return points;

  return [{ date: "All", campaigns: campaigns.length, volunteers: applications.length }];
}

export function ProgrammeActivityChart({ className }: { className?: string }) {
  const chartUid = useId().replace(/:/g, "");
  const idLineGlow = `programme-line-glow-${chartUid}`;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-programme-activity"],
    enabled: isSupabaseConfigured(),
    queryFn: async () => {
      const [campaigns, applications] = await Promise.all([
        fetchCampaigns({ limit: 100 }),
        fetchAllApplications(100),
      ]);
      const chartData = buildProgrammeSeries(campaigns, applications);
      const first = chartData[0]?.campaigns ?? 0;
      const last = chartData.at(-1)?.campaigns ?? first;
      const growthPct = first > 0 ? ((last - first) / first) * 100 : 0;
      return { chartData, growthPct };
    },
  });

  const chartData = data?.chartData ?? [];
  const growthPct = data?.growthPct ?? 0;

  return (
    <DashboardCard className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Programme activity</CardTitle>
            <CardDescription>Campaign and volunteer application counts by category.</CardDescription>
          </div>
          <Delta value={growthPct} variant="badge">
            <DeltaIcon variant="trend" />
            <DeltaValue />
          </Delta>
        </div>
      </CardHeader>
      <CardContent>
        <DataState
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && chartData.length === 0}
          emptyMessage="No programme activity yet."
          loadingMessage="Loading programme activity..."
        >
          <ChartContainer className="aspect-auto h-60 w-full md:h-72" config={chartConfig}>
            <LineChart data={chartData} margin={{ left: 12, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis axisLine={false} dataKey="date" tickLine={false} tickMargin={8} />
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
        </DataState>
      </CardContent>
    </DashboardCard>
  );
}
