import { themeNames, themePresets } from "@/theme/themePresets";
import { useTheme } from "@/theme/ThemeProvider";

type ThemeSelectorProps = {
  className?: string;
};

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={className}>
      <label htmlFor="theme-selector" className="mb-2 block text-sm font-semibold">
        Theme
      </label>
      <select
        id="theme-selector"
        value={theme}
        onChange={(event) => setTheme(event.target.value as typeof theme)}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground outline-none focus:ring-2 focus:ring-ring"
        aria-label="Select website theme"
      >
        {themeNames.map((name) => (
          <option key={name} value={name}>
            {themePresets[name].label}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs opacity-80">{themePresets[theme].description}</p>
    </div>
  );
}
