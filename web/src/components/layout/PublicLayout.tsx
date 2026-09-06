import { Outlet } from "react-router-dom";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { SupabaseSetupNotice } from "@/components/shared/SupabaseSetupNotice";

export function PublicLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background bg-[image:var(--page-gradient)] text-foreground">
      <AnimatedBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <SupabaseSetupNotice />
        <PublicNavbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <PublicFooter />
      </div>
    </div>
  );
}
