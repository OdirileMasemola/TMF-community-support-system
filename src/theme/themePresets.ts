import type { ThemeName, ThemePreset } from "@/theme/themeTypes";

export const themePresets: Record<ThemeName, ThemePreset> = {
  system: {
    label: "TMF Default",
    description:
      "Official TMF colour palette using Baltic Blue, Pacific Blue, Powder Blue, Carbon Black, White, and Light Grey.",
  },
  blue: {
    label: "Baltic Blue",
    description: "A stronger blue theme based on the official Baltic Blue brand colour.",
  },
  light: {
    label: "Clean Light",
    description: "A soft light theme using White, Light Grey, and Powder Blue.",
  },
  dark: {
    label: "Carbon Dark",
    description: "A dark theme based on Carbon Black with blue highlights.",
  },
};

export const themeNames = Object.keys(themePresets) as ThemeName[];
