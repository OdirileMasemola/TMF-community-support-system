"use client";

import type * as React from "react";
import { Bar, BarChart, XAxis } from "recharts";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Delta, DeltaIcon, DeltaValue } from "@/components/efferd/delta";
import { DashboardCard } from "@/components/efferd/dashboard-card";

const donationDaily = [
  { day: "Mon", donations: 8200 },
  { day: "Tue", donations: 7600 },
  { day: "Wed", donations: 9100 },
  { day: "Thu", donations: 9800 },
  { day: "Fri", donations: 11200 },
  { day: "Sat", donations: 10400 },
  { day: "Sun", donations: 12400 },
] as const;

const firstDay = donationDaily[0].donations;
const lastDay = donationDaily.at(-1)?.donations ?? firstDay;
const growthPct = (((lastDay - firstDay) / firstDay) * 100);

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

export function DonationTrendsChart({ className }: { className?: string }) {
  return (
    <DashboardCard className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Donation trends</CardTitle>
            <CardDescription>Daily verified donations, last 7 days.</CardDescription>
          </div>
          <Delta value={growthPct} variant="badge">
            <DeltaIcon variant="trend" />
            <DeltaValue />
          </Delta>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer className="aspect-auto h-60 w-full md:h-72" config={chartConfig}>
          <BarChart data={donationDaily.map((row) => ({ ...row }))} margin={{ left: 12, right: 12, top: 8 }}>
            <XAxis axisLine={false} dataKey="day" tickLine={false} tickMargin={10} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
            <Bar dataKey="donations" fill="var(--color-donations)" shape={<GradientBar />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </DashboardCard>
  );
}
