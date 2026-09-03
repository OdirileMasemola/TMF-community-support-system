import { Outlet, useLocation } from "react-router-dom";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { SupabaseSetupNotice } from "@/components/shared/SupabaseSetupNotice";

export function PublicLayout() {
  const { pathname } = useLocation();
  const isAuthPage = ["/login", "/register", "/register/complete-profile"].includes(pathname);

  if (isAuthPage) {
    return (
      <div className="min-h-[100dvh]">
        <Outlet />
      </div>
    );
  }

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
