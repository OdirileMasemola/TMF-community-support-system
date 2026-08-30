/**
 * TMF official colour palette, mirroring src/styles/theme.css so the mobile app
 * and the web dashboard stay visually identical.
 *
 *   Carbon Black #222222 · Baltic Blue #1C5D99 · Pacific Blue #639FAB
 *   Powder Blue  #BBCDE5 · White       #FFFFFF · Light Grey   #F5F5F5
 *
 * `muted` doubles as the screen background and `card` as the surface above it,
 * so in the dark palette `muted` is the darker of the two.
 */
export const lightColors = {
  background: "#ffffff",
  foreground: "#222222",
  card: "#ffffff",
  primary: "#1c5d99",
  primaryForeground: "#ffffff",
  secondary: "#639fab",
  secondaryForeground: "#ffffff",
  muted: "#f5f5f5",
  mutedForeground: "#4b5563",
  accent: "#bbcde5",
  accentForeground: "#222222",
  border: "#d1d5db",
  borderSubtle: "#e5e7eb",
  destructive: "#b91c1c",
  destructiveSurface: "#fef2f2",
  success: "#15803d",
  successSurface: "#f0fdf4",
  warning: "#b45309",
  warningSurface: "#fffbeb",
  overlay: "rgba(34, 34, 34, 0.55)",
  /** Tint behind the active bottom-nav tab and list-row icon chips. */
  primarySurface: "rgba(28, 93, 153, 0.10)",
  secondarySurface: "rgba(99, 159, 171, 0.12)",
} as const;

export type ThemeColors = { [K in keyof typeof lightColors]: string };

/**
 * Baltic Blue is too dark to read against a dark surface, so the dark palette
 * lifts the brand blues and pairs them with dark foreground text.
 */
export const darkColors: ThemeColors = {
  background: "#12161b",
  foreground: "#f3f5f7",
  card: "#1c222a",
  primary: "#63a4de",
  primaryForeground: "#0f151b",
  secondary: "#7fb8c4",
  secondaryForeground: "#0f151b",
  muted: "#12161b",
  mutedForeground: "#9ba7b4",
  accent: "#2b3a4d",
  accentForeground: "#d6e4f5",
  border: "#39424e",
  borderSubtle: "#262d36",
  destructive: "#f87171",
  destructiveSurface: "#3a1d1d",
  success: "#4ade80",
  successSurface: "#16301f",
  warning: "#fbbf24",
  warningSurface: "#382a12",
  overlay: "rgba(0, 0, 0, 0.65)",
  primarySurface: "rgba(99, 164, 222, 0.16)",
  secondarySurface: "rgba(127, 184, 196, 0.16)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: "400" },
  bodyStrong: { fontSize: 15, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600" },
  caption: { fontSize: 12, fontWeight: "400" },
  /** Matches the uppercase tracked eyebrow text used on the web auth pages. */
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  metric: { fontSize: 26, fontWeight: "800", letterSpacing: -0.8 },
} as const;

/** Soft elevation. Web uses box-shadow; native needs the platform pair. */
export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
} as const;

type StatusTone = { fg: string; bg: string };

/** Status pill colours shared by every portal. */
export function statusTone(status: string | null | undefined, colors: ThemeColors): StatusTone {
  switch (status) {
    case "active":
    case "approved":
    case "successful":
    case "completed":
    case "verified":
    case "read":
      return { fg: colors.success, bg: colors.successSurface };
    case "pending":
    case "under_review":
    case "open":
    case "submitted":
    case "unread":
      return { fg: colors.warning, bg: colors.warningSurface };
    case "rejected":
    case "failed":
    case "cancelled":
    case "suspended":
    case "high":
    case "urgent":
      return { fg: colors.destructive, bg: colors.destructiveSurface };
    default:
      return { fg: colors.mutedForeground, bg: colors.muted };
  }
}
