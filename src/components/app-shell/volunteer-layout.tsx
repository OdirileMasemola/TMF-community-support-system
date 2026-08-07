import { Outlet } from "react-router-dom";
import { AdminErrorBoundary } from "@/components/app-shell/admin-error-boundary";
import { AppShell } from "@/components/app-shell/app-shell";
import { volunteerNavGroups } from "@/components/app-shell/volunteer-shared";

export function VolunteerLayout() {
  return (
    <AppShell navGroups={volunteerNavGroups}>
      <AdminErrorBoundary>
        <Outlet />
      </AdminErrorBoundary>
    </AppShell>
  );
}
