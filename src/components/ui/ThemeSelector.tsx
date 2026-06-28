import { Moon, Sun } from "lucide-react";
import { themePresets } from "@/theme/themePresets";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/utils";

type ThemeSelectorProps = {
  className?: string;
};

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const switchLabel = isDark
    ? `Switch to ${themePresets.light.label}`
    : `Switch to ${themePresets.dark.label}`;

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      aria-label={switchLabel}
      title={switchLabel}
    >
      {isDark ? <Moon className="size-4" aria-hidden="true" /> : <Sun className="size-4" aria-hidden="true" />}
    </button>
  );
}
