import * as React from "react";
import { cn } from "@/lib/utils";

export function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" className={cn("", className)} {...props} />;
}

export function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return <ol className={cn("flex flex-wrap items-center gap-1.5 text-sm", className)} {...props} />;
}

export function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("inline-flex items-center gap-1.5", className)} {...props} />;
}

export function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return <span role="link" aria-disabled="true" aria-current="page" className={cn("font-medium text-foreground", className)} {...props} />;
}
