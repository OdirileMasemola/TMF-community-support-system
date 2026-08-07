import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type QuickActionCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
};

export function QuickActionCard({ title, description, icon: Icon, route }: QuickActionCardProps) {
  return (
    <Link
      to={route}
      className={cn(
        "group flex h-full flex-col rounded-lg border border-border bg-card/70 p-5 text-card-foreground backdrop-blur-xl",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary",
            "transition-all duration-300 group-hover:shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_35%,transparent)]",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}
