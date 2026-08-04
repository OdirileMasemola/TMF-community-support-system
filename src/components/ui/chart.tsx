"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    color?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a ChartContainer");
  }
  return context;
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-layer]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        style={
          Object.fromEntries(
            Object.entries(config)
              .filter(([, item]) => item.color)
              .map(([key, item]) => [`--color-${key}`, item.color as string]),
          ) as React.CSSProperties
        }
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

export const ChartTooltip = RechartsPrimitive.Tooltip;

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean;
    payload?: Array<{
      dataKey?: string | number;
      name?: string;
      value?: number;
      color?: string;
      payload?: Record<string, unknown>;
    }>;
    hideLabel?: boolean;
    indicator?: "line" | "dot" | "dashed";
  }
>(({ active, payload, className, hideLabel = false, indicator = "dot" }, ref) => {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {!hideLabel && payload[0]?.payload?.day ? (
        <span className="font-medium text-foreground">{String(payload[0].payload.day)}</span>
      ) : null}
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name ?? "value");
        const label = config[key]?.label ?? key;
        return (
          <div key={key} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              {indicator === "dot" ? (
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              ) : null}
              {label}
            </div>
            <span className="font-medium tabular-nums text-foreground">{item.value?.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
});
ChartTooltipContent.displayName = "ChartTooltipContent";
