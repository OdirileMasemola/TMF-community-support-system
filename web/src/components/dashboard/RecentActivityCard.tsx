import type { LucideIcon } from "lucide-react";

type RecentActivityCardProps = {
  title: string;
  description: string;
  timestamp: string;
  icon: LucideIcon;
};

export function RecentActivityCard({
  title,
  description,
  timestamp,
  icon: Icon,
}: RecentActivityCardProps) {
  return (
    <article className="flex gap-4 border-b border-border py-4 last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        <time className="mt-2 block text-xs text-muted-foreground">{timestamp}</time>
      </div>
    </article>
  );
}
