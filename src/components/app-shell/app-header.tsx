"use client";

import { Bell, PanelLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Separator } from "@/components/ui/separator";
import { ThemeSelector } from "@/components/ui/ThemeSelector";import { AppBreadcrumbs } from "@/components/app-shell/app-breadcrumbs";
import { navLinks } from "@/components/app-shell/app-shared";
import { NavUser } from "@/components/app-shell/nav-user";
import { useSidebar } from "@/components/app-shell/sidebar-context";
import { cn } from "@/lib/utils";

const activeItem = navLinks.find((item) => item.isActive);

export function AppHeader() {
  const { toggle } = useSidebar();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4 md:px-6",
        "bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/50",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <Button type="button" variant="ghost" size="icon" onClick={toggle} aria-label="Toggle sidebar">
          <PanelLeft className="size-4" aria-hidden="true" />
        </Button>
        <Separator className="mr-2 hidden h-4 md:block" orientation="vertical" />
        <AppBreadcrumbs page={activeItem ? { title: activeItem.title, icon: activeItem.icon } : null} />
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Send update">
          <Send className="size-4" aria-hidden="true" />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" aria-hidden="true" />
        </Button>
        <ThemeSelector className="size-10 rounded-md border-0 bg-transparent hover:bg-accent" />
        <Separator className="hidden h-4 md:block" orientation="vertical" />        <NavUser />
      </div>
    </header>
  );
}
