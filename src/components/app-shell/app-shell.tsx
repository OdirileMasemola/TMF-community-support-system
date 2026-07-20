import type { PropsWithChildren } from "react";
import { AppHeader } from "@/components/app-shell/app-header";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { SidebarProvider } from "@/components/app-shell/sidebar-context";
import { cn } from "@/lib/utils";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-muted/40">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className={cn("mx-auto flex w-full max-w-[1400px] flex-1 flex-col p-4 md:p-6")}>{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
