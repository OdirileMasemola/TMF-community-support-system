import { useContext } from "react";
import { SidebarContext } from "@/components/app-shell/sidebar-context-value";

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}
