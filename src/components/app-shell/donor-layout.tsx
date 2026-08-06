import { Outlet } from "react-router-dom";
import { AdminErrorBoundary } from "@/components/app-shell/admin-error-boundary";
import { AppShell } from "@/components/app-shell/app-shell";
import { donorNavGroups } from "@/components/app-shell/donor-shared";

export function DonorLayout() {
  return (
    <AppShell navGroups={donorNavGroups}>
      <AdminErrorBoundary>
        <Outlet />
      </AdminErrorBoundary>
    </AppShell>
  );
}
