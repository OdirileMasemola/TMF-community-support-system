import type { PropsWithChildren } from "react";
import { AppHeader } from "@/components/app-shell/app-header";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { navGroups as adminNavGroups, type SidebarNavGroup } from "@/components/app-shell/app-shared";
import { SidebarProvider } from "@/components/app-shell/sidebar-context";
import { cn } from "@/lib/utils";

type AppShellProps = PropsWithChildren<{
  navGroups?: SidebarNavGroup[];
}>;

export function AppShell({ children, navGroups = adminNavGroups }: AppShellProps) {
  const navLinks = navGroups.flatMap((group) => group.items);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen overflow-x-hidden bg-muted/40">
        <AppSidebar navGroups={navGroups} />
        <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <AppHeader navLinks={navLinks} />
          <main className={cn("mx-auto flex w-full min-w-0 max-w-[1400px] flex-1 flex-col p-4 md:p-6")}>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
