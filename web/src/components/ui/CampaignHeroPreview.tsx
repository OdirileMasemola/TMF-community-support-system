import { AnimatedGroup } from "@/components/ui/AnimatedGroup";

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
