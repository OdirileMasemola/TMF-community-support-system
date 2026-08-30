import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkColors, lightColors, type ThemeColors } from "@/theme/tokens";

export type ThemeMode = "light" | "dark" | "system";
export type ColorScheme = "light" | "dark";

const STORAGE_KEY = "tmf.theme-mode";

type ThemeContextValue = {
  /** What the user picked, which may be "system". */
  mode: ThemeMode;
  /** What that resolves to right now. */
  scheme: ColorScheme;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  // Load the saved choice once. Until it arrives we render the system theme,
  // which is the same thing "system" mode would show anyway.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        if (stored === "light" || stored === "dark" || stored === "system") {
          setModeState(stored);
        }
      })
      .catch(() => {
        // A failed read just means we keep the default; not worth surfacing.
      });
    return () => {
      active = false;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // The choice still applies for this session even if it cannot persist.
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme: ColorScheme = mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;
    const isDark = scheme === "dark";
    return {
      mode,
      scheme,
      isDark,
      colors: isDark ? darkColors : lightColors,
      setMode,
    };
  }, [mode, setMode, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside a ThemeProvider.");
  return context;
}

/**
 * StyleSheets are built at module scope by default, which would freeze the
 * palette at import time. Factories run through here instead so styles rebuild
 * whenever the active theme changes.
 */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
