import { createContext } from "react";
import type { ThemeName } from "@/theme/themeTypes";

export type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
