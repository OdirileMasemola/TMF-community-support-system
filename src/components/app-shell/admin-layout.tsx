import { Outlet } from "react-router-dom";
import { AdminErrorBoundary } from "@/components/app-shell/admin-error-boundary";
import { AppShell } from "@/components/app-shell/app-shell";

export function AdminLayout() {
  return (
    <AppShell>
      <AdminErrorBoundary>
        <Outlet />
      </AdminErrorBoundary>
    </AppShell>
  );
}
