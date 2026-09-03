import { Outlet } from "react-router-dom";
import { AdminErrorBoundary } from "@/components/app-shell/admin-error-boundary";
import { AppShell } from "@/components/app-shell/app-shell";
import { sponsorNavGroups } from "@/components/app-shell/sponsor-shared";

export function SponsorLayout() {
  return (
    <AppShell navGroups={sponsorNavGroups}>
      <AdminErrorBoundary>
        <Outlet />
      </AdminErrorBoundary>
    </AppShell>
  );
}
