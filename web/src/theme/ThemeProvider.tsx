import { useEffect, useState, type ReactNode } from "react";
import { ThemeContext } from "@/theme/theme-context";
import type { ThemeName } from "@/theme/themeTypes";

const STORAGE_KEY = "tmf-theme";

function isThemeName(value: string | null): value is ThemeName {
  return value === "light" || value === "dark";
}

function applyTheme(theme: ThemeName) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

function getInitialTheme(): ThemeName {
  const stored = localStorage.getItem(STORAGE_KEY);
  return isThemeName(stored) ? stored : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (next: ThemeName) => setThemeState(next);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
