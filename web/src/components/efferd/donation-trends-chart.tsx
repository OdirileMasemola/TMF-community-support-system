"use client";

import type * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, XAxis } from "recharts";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Delta, DeltaIcon, DeltaValue } from "@/components/efferd/delta";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchAllDonations } from "@/services/donations";

const chartConfig = {
  donations: {
    label: "Donations",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function GradientBar(props: React.SVGProps<SVGRectElement> & { index?: number; dataKey?: string | number }) {
  const { x = 0, y = 0, width = 0, height = 0, index = 0, dataKey = "donations" } = props;
  const gid = `gradient-bar-${String(dataKey)}-${index}`;

  return (
    <>
      <rect fill={`url(#${gid})`} height={height} width={width} x={x} y={y} />
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--color-donations)" stopOpacity={0.95} />
          <stop offset="100%" stopColor="var(--color-donations)" stopOpacity={0.35} />
        </linearGradient>
      </defs>
    </>
  );
}

function buildMonthlyTotals(donations: Awaited<ReturnType<typeof fetchAllDonations>>) {
  const now = new Date();
  const months: { key: string; day: string; donations: number }[] = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const day = new Intl.DateTimeFormat("en-ZA", { month: "short" }).format(date);
    months.push({ key, day, donations: 0 });
  }

  for (const donation of donations) {
    if (donation.status !== "successful") continue;
    const donatedAt = new Date(donation.donation_date);
    if (Number.isNaN(donatedAt.getTime())) continue;
    const key = `${donatedAt.getFullYear()}-${String(donatedAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = months.find((month) => month.key === key);
    if (bucket) {
      bucket.donations += Number(donation.amount ?? 0);
    }
  }

  return months.map(({ day, donations: total }) => ({ day, donations: total }));
}

export function DonationTrendsChart({ className }: { className?: string }) {
  const { data: chartData = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-donation-trends"],
    enabled: isSupabaseConfigured(),
    queryFn: async () => {
      const donations = await fetchAllDonations(500);
      return buildMonthlyTotals(donations);
    },
  });

  const firstMonth = chartData[0]?.donations ?? 0;
  const lastMonth = chartData.at(-1)?.donations ?? firstMonth;
  const growthPct = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0;

  return (
    <DashboardCard className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Donation trends</CardTitle>
            <CardDescription>Monthly verified donations, last 6 months.</CardDescription>
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
          loadingMessage="Loading donation trends..."
        >
          <ChartContainer className="aspect-auto h-60 w-full md:h-72" config={chartConfig}>
            <BarChart data={chartData} margin={{ left: 12, right: 12, top: 8 }}>
              <XAxis axisLine={false} dataKey="day" tickLine={false} tickMargin={10} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
              <Bar dataKey="donations" fill="var(--color-donations)" shape={<GradientBar />} />
            </BarChart>
          </ChartContainer>
        </DataState>
      </CardContent>
    </DashboardCard>
  );
}
