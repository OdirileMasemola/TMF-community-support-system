import { cn } from "@/lib/utils";

export function AdminStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        status.toLowerCase() === "active" ||
          status.toLowerCase() === "verified" ||
          status.toLowerCase() === "approved" ||
          status.toLowerCase() === "scheduled" ||
          status.toLowerCase() === "completed"
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : status.toLowerCase() === "pending" ||
              status.toLowerCase() === "review" ||
              status.toLowerCase() === "draft"
            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            : "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}
