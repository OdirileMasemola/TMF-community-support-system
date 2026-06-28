import type { ThemeName, ThemePreset } from "@/theme/themeTypes";

export const themePresets: Record<ThemeName, ThemePreset> = {
  light: {
    label: "White Theme",
    description: "A clean white interface with dark text and visible grey borders.",
  },
  dark: {
    label: "Dark Theme",
    description: "A solid black and grey interface with light text and visible light grey borders.",
  },
};

export const themeNames: ThemeName[] = ["light", "dark"];

export const themeOptions = themeNames.map((name) => ({
  name,
  ...themePresets[name],
}));
