"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DeltaContextValue = {
  value: number;
};

const DeltaContext = React.createContext<DeltaContextValue | null>(null);

function useDeltaValue() {
  const context = React.useContext(DeltaContext);
  if (!context) {
    throw new Error("DeltaIcon and DeltaValue must be used inside a Delta component.");
  }
  return context.value;
}

export function Delta({
  className,
  value,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { value: number; variant?: "default" | "badge" }) {
  return (
    <DeltaContext.Provider value={{ value }}>
      {variant === "badge" ? (
        <Badge
          className={cn(
            "gap-1 border-none tabular-nums [&_svg]:size-4",
            value > 0 ? "bg-emerald-500/10 text-emerald-600" : value < 0 ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground",
            className,
          )}
          variant="secondary"
          {...(props as React.ComponentProps<typeof Badge>)}
        />
      ) : (
        <div
          className={cn(
            "inline-flex items-center gap-1 tabular-nums text-muted-foreground [&_svg]:size-3",
            value > 0 && "text-emerald-600 dark:text-emerald-400",
            value < 0 && "text-rose-600 dark:text-rose-400",
            className,
          )}
          {...props}
        />
      )}
    </DeltaContext.Provider>
  );
}

export function DeltaIcon({
  variant = "default",
  className,
}: {
  variant?: "default" | "trend" | "arrow";
  className?: string;
}) {
  const value = useDeltaValue();

  if (!value) {
    return <Minus className={className} aria-hidden="true" />;
  }

  if (value > 0) {
    if (variant === "trend") return <TrendingUp className={className} aria-hidden="true" />;
    if (variant === "arrow") return <ChevronUp className={className} aria-hidden="true" />;
    return <ChevronUp className={className} aria-hidden="true" />;
  }

  if (variant === "trend") return <TrendingDown className={className} aria-hidden="true" />;
  if (variant === "arrow") return <ChevronDown className={className} aria-hidden="true" />;
  return <ChevronDown className={className} aria-hidden="true" />;
}

export function DeltaValue({
  className,
  precision = 1,
  suffix = "%",
  absolute = true,
  ...props
}: React.ComponentProps<"span"> & { precision?: number; suffix?: string; absolute?: boolean }) {
  const value = useDeltaValue();
  const formattedValue = (absolute ? Math.abs(value) : value).toFixed(precision);

  return (
    <span className={cn("tabular-nums", className)} {...props}>
      {formattedValue}
      {suffix}
    </span>
  );
}
