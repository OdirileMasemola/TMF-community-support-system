import { Outlet } from "react-router-dom";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background bg-[image:var(--page-gradient)] text-foreground">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
