"use client";

import { NavLink } from "react-router-dom";
import { navGroups } from "@/components/app-shell/app-shared";
import { useSidebar } from "@/components/app-shell/sidebar-context";
import { cn } from "@/lib/utils";
import logoImage from "@/assets/images/logo.jpeg";

export function AppSidebar() {
  const { collapsed } = useSidebar();

  return (    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 border-r border-border bg-background transition-[width] duration-200 lg:flex lg:flex-col",
        collapsed ? "w-[72px]" : "w-72",
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-border px-4", collapsed && "justify-center px-2")}>
        <img
          src={logoImage}
          alt="Themba Molefe Foundation"
          className={cn("rounded-md object-cover", collapsed ? "size-8" : "size-9")}
        />
        {!collapsed ? (
          <div className="ml-3 min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-primary">TMF</p>
            <p className="truncate text-sm font-semibold text-foreground">Community Support</p>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            {!collapsed && group.label ? (
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
            ) : null}
            <nav className="grid gap-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.path ?? "#"}
                  title={collapsed ? item.title : undefined}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      collapsed && "justify-center px-2",
                      (isActive || item.isActive) && "bg-accent text-primary",
                    )
                  }
                >
                  {item.icon}
                  {!collapsed ? <span>{item.title}</span> : null}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      {!collapsed ? (        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Themba Molefe Foundation
        </div>
      ) : null}
    </aside>
  );
}
