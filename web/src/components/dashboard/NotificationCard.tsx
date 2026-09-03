import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationCardProps = {
  title: string;
  timestamp: string;
  unread: boolean;
  icon: LucideIcon;
};

export function NotificationCard({ title, timestamp, unread, icon: Icon }: NotificationCardProps) {
  return (
    <article
      className={cn(
        "flex items-start gap-4 rounded-xl border border-border p-4 transition-colors",
        unread ? "bg-accent/50" : "bg-card/70 backdrop-blur-xl",
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {unread ? (
            <span className="inline-flex rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Unread
            </span>
          ) : null}
        </div>
        <time className="mt-1 block text-xs text-muted-foreground">{timestamp}</time>
      </div>
    </article>
  );
}
