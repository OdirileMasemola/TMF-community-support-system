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
      </div>
    </AnimatedGroup>
  );
}
