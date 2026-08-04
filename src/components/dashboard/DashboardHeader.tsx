import { Button } from "@/components/ui/Button";

type DashboardHeaderProps = {
  label: string;
  title: string;
  subtitle: string;
  primaryActionLabel: string;
  secondaryActionLabel: string;
};

export function DashboardHeader({
  label,
  title,
  subtitle,
  primaryActionLabel,
  secondaryActionLabel,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{label}</p>
        <h1 className="page-title mt-2 text-2xl md:text-3xl">{title}</h1>
        <p className="page-description mt-2 max-w-2xl text-sm md:text-base">{subtitle}</p>
      </div>

      <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
        <Button type="button" aria-label={primaryActionLabel}>
          {primaryActionLabel}
        </Button>
        <Button type="button" variant="outline" aria-label={secondaryActionLabel}>
          {secondaryActionLabel}
        </Button>
      </div>
    </header>
  );
}
