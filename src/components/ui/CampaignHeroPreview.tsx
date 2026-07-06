import { AnimatedGroup } from "@/components/ui/AnimatedGroup";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Active", value: "2", tone: "emerald" },
  { label: "Upcoming", value: "2", tone: "cyan" },
  { label: "Completed", value: "2", tone: "zinc" },
] as const;

const statToneClasses: Record<(typeof stats)[number]["tone"], string> = {
  emerald:
    "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/50 dark:text-emerald-300",
  cyan: "border-cyan-500/40 bg-cyan-500/15 text-cyan-700 dark:border-cyan-400/50 dark:text-cyan-300",
  zinc: "border-zinc-500/40 bg-zinc-500/15 text-zinc-700 dark:border-zinc-400/50 dark:text-zinc-300",
};

export function CampaignHeroPreview() {
  return (
    <AnimatedGroup className="relative mt-12 md:mt-16">
      <div className="relative overflow-hidden px-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent from-35% to-transparent"
        />

        <div className="relative mx-auto max-w-3xl rounded-3xl border border-border bg-card/70 p-6 text-card-foreground shadow-lg backdrop-blur-xl md:p-8">
          <h2 className="text-lg font-semibold text-foreground md:text-xl">Campaign Overview</h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "flex flex-col items-center rounded-2xl border px-4 py-4 text-center backdrop-blur",
                  statToneClasses[stat.tone],
                )}
              >
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="mt-1 text-sm font-medium">{stat.label}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Public campaigns are currently shown using static placeholder data. Supabase fetching
            will be connected later.
          </p>
        </div>
      </div>
    </AnimatedGroup>
  );
}
