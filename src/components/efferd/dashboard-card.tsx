import { cn } from "@/lib/utils";
import type * as React from "react";
import { Card } from "@/components/ui/Card";

export function DashboardCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return <Card className={cn("rounded-none border-0 bg-background p-0 shadow-none", className)} {...props} />;
}
