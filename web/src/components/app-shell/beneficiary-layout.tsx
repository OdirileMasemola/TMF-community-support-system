import { Outlet } from "react-router-dom";
import { AdminErrorBoundary } from "@/components/app-shell/admin-error-boundary";
import { AppShell } from "@/components/app-shell/app-shell";
import { beneficiaryNavGroups } from "@/components/app-shell/beneficiary-shared";

export function BeneficiaryLayout() {
  return (
    <AppShell navGroups={beneficiaryNavGroups}>
      <AdminErrorBoundary>
        <Outlet />
      </AdminErrorBoundary>
    </AppShell>
  );
}
