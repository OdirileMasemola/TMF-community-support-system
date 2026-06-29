import { Outlet } from "react-router-dom";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { SupabaseSetupNotice } from "@/components/shared/SupabaseSetupNotice";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background bg-[image:var(--page-gradient)] text-foreground">
      <SupabaseSetupNotice />
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
