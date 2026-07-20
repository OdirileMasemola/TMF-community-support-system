import { AdminPageHeader } from "@/components/admin/admin-page-header";
import type { ReactNode } from "react";

type AdminPageShellProps = {
  label: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPageShell({ label, title, description, actions, children }: AdminPageShellProps) {
  return (
    <div className="space-y-6">
      <AdminPageHeader label={label} title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}
