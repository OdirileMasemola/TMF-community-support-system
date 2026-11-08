import { createContext } from "react";

export type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
};

export const SidebarContext = createContext<SidebarContextValue | null>(null);
