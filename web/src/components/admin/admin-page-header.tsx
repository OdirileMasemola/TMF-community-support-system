import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  label: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function AdminPageHeader({ label, title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{label}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
