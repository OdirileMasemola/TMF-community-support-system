import { Children } from "react";
import type { ComponentType, PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { GoogleIcon } from "@/components/GoogleIcon";
import { useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { radius, shadow, spacing, statusTone, typography, type ThemeColors } from "@/theme/tokens";

type IconProps = { size?: number; color?: string; strokeWidth?: number };
type IconComponent = ComponentType<IconProps>;

export function Screen({
  children,
  onRefresh,
  refreshing = false,
}: PropsWithChildren<{ onRefresh?: () => void; refreshing?: boolean }>) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

/** Eyebrow + title + subtitle, the same hierarchy as the web page headers. */
export function PageHeading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.heading}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.headingTitle}>{title}</Text>
      {subtitle ? <Text style={styles.headingSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const styles = useThemedStyles(createStyles);
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionCard({
  title,
  action,
  children,
}: PropsWithChildren<{ title: string; action?: ReactNode }>) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      {children}
    </View>
  );
}

/**
 * Metric tile. `tone` tints the icon chip so a screen reads at a glance
 * without needing charts, which have no native equivalent yet.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
  wide = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: IconComponent;
  tone?: "primary" | "secondary" | "accent";
  wide?: boolean;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  const chipColor =
    tone === "secondary" ? colors.secondary : tone === "accent" ? colors.accentForeground : colors.primary;
  const chipBackground =
    tone === "secondary" ? colors.secondarySurface : tone === "accent" ? colors.accent : colors.primarySurface;

  return (
    <View style={[styles.statCard, wide && styles.statCardWide]}>
      {Icon ? (
        <View style={[styles.statChip, { backgroundColor: chipBackground }]}>
          <Icon size={16} color={chipColor} />
        </View>
      ) : null}
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

export function StatGrid({ children }: PropsWithChildren) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.statGrid}>{children}</View>;
}

export function Badge({ label, status }: { label: string; status?: string | null }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const tone = statusTone(status ?? label.toLowerCase(), colors);

  return (
    <View style={[styles.badge, { backgroundColor: tone.bg }]}>
      <Text style={[styles.badgeText, { color: tone.fg }]}>{label}</Text>
    </View>
  );
}

/** Thin funding/progress meter, replacing the web's recharts bars. */
export function ProgressBar({ percent }: { percent: number }) {
  const styles = useThemedStyles(createStyles);
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${clamped}%` }]} />
    </View>
  );
}

export function ListRow({
  label,
  value,
  right,
  icon: Icon,
  last = false,
  progress,
  footer,
  onPress,
}: {
  label: string;
  value?: string;
  right?: ReactNode;
  icon?: IconComponent;
  last?: boolean;
  progress?: number;
  /** Rendered under the row, e.g. action buttons on an admin review queue. */
  footer?: ReactNode;
  onPress?: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  const body = (
    <>
      <View style={styles.rowTop}>
        {Icon ? (
          <View style={styles.rowIcon}>
            <Icon size={15} color={colors.primary} />
          </View>
        ) : null}
        <View style={styles.rowMain}>
          <Text style={styles.rowLabel} numberOfLines={1}>
            {label}
          </Text>
          {value ? (
            <Text style={styles.rowValue} numberOfLines={3}>
              {value}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {typeof progress === "number" ? <ProgressBar percent={progress} /> : null}
      {footer ? <View style={styles.rowFooter}>{footer}</View> : null}
    </>
  );

  if (!onPress) return <View style={[styles.row, last && styles.rowLast]}>{body}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && styles.rowPressed]}
    >
      {body}
    </Pressable>
  );
}

/**
 * Tap-to-pick pill group. React Native has no native <select>, and a modal
 * picker is heavy for the short option lists these forms use.
 */
export function ChipSelect<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label?: string;
  hint?: string;
  options: ReadonlyArray<{ label: string; value: T }>;
  value: T | null;
  onChange: (value: T) => void;
}) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.field}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.chipRow}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.chipPressed]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

/** Lays buttons out side by side at equal width, e.g. approve / reject. */
export function ButtonRow({ children }: PropsWithChildren) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.buttonRow}>
      {Children.map(children, (child) => (
        <View style={styles.buttonRowItem}>{child}</View>
      ))}
    </View>
  );
}

export function SuccessBanner({ label }: { label: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.successBanner}>
      <Text style={styles.successBannerText}>{label}</Text>
    </View>
  );
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  const isPrimary = variant === "primary";
  const textColor = isPrimary ? colors.primaryForeground : variant === "ghost" ? colors.mutedForeground : colors.foreground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.buttonPrimary,
        variant === "outline" && styles.buttonOutline,
        variant === "ghost" && styles.buttonGhost,
        pressed && styles.buttonPressed,
        (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.primaryForeground : colors.primary} />
      ) : (
        <View style={styles.buttonInner}>
          {icon}
          <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function GoogleButton({
  onPress,
  disabled = false,
  loading = false,
  label = "Continue with Google",
}: {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}) {
  return (
    <AppButton
      label={label}
      onPress={onPress}
      variant="outline"
      disabled={disabled}
      loading={loading}
      icon={<GoogleIcon size={18} />}
    />
  );
}

export function Divider({ text }: { text?: string }) {
  const styles = useThemedStyles(createStyles);
  if (!text) return <View style={styles.dividerLine} />;

  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>{text}</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export function TextField({
  label,
  hint,
  ...inputProps
}: { label: string; hint?: string } & TextInputProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.mutedForeground} {...inputProps} />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  return (
    <View style={styles.centred}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.centredText}>{label}</Text>
    </View>
  );
}

export function ErrorState({ label = "Something went wrong. Pull down to retry." }: { label?: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{label}</Text>
    </View>
  );
}

export function EmptyState({ label }: { label: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.centred}>
      <Text style={styles.centredText}>{label}</Text>
    </View>
  );
}

/** Inline empty text used inside a section card. */
export function EmptyRow({ label }: { label: string }) {
  const styles = useThemedStyles(createStyles);
  return <Text style={styles.emptyRow}>{label}</Text>;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.muted,
    },
    screenContent: {
      padding: spacing.lg,
      gap: spacing.lg,
      // Clears the floating BottomNavBar dock so the last card stays tappable.
      paddingBottom: 116,
    },
    heading: {
      gap: spacing.xs,
    },
    eyebrow: {
      ...typography.eyebrow,
      color: colors.primary,
    },
    headingTitle: {
      ...typography.title,
      color: colors.foreground,
    },
    headingSubtitle: {
      ...typography.body,
      color: colors.mutedForeground,
      lineHeight: 21,
    },
    card: {
      backgroundColor: colors.card,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.lg,
      gap: spacing.sm,
      ...shadow.card,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.xs,
    },
    sectionTitle: {
      ...typography.heading,
      color: colors.foreground,
    },
    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    statCard: {
      flexGrow: 1,
      flexBasis: "45%",
      backgroundColor: colors.card,
      borderColor: colors.borderSubtle,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.lg,
      gap: spacing.xs,
      ...shadow.card,
    },
    statCardWide: {
      flexBasis: "100%",
    },
    statChip: {
      width: 30,
      height: 30,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xs,
    },
    statValue: {
      ...typography.metric,
      color: colors.foreground,
    },
    statLabel: {
      ...typography.label,
      color: colors.foreground,
    },
    statHint: {
      ...typography.caption,
      color: colors.mutedForeground,
    },
    badge: {
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 5,
      alignSelf: "flex-start",
    },
    badgeText: {
      ...typography.caption,
      fontWeight: "700",
    },
    progressTrack: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.borderSubtle,
      overflow: "hidden",
      marginTop: spacing.sm,
    },
    progressFill: {
      height: "100%",
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
    },
    row: {
      paddingVertical: spacing.md,
      borderBottomColor: colors.borderSubtle,
      borderBottomWidth: 1,
    },
    rowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    rowPressed: {
      opacity: 0.6,
    },
    rowFooter: {
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    buttonRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    buttonRowItem: {
      flex: 1,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    chip: {
      minHeight: 38,
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    chipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipPressed: {
      opacity: 0.75,
    },
    chipText: {
      ...typography.label,
      color: colors.mutedForeground,
    },
    chipTextSelected: {
      color: colors.primaryForeground,
    },
    successBanner: {
      backgroundColor: colors.successSurface,
      borderColor: colors.success,
      borderWidth: 1,
      borderRadius: radius.sm,
      padding: spacing.md,
    },
    successBannerText: {
      ...typography.caption,
      color: colors.success,
    },
    rowTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    rowIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySurface,
      alignItems: "center",
      justifyContent: "center",
    },
    rowMain: {
      flex: 1,
      gap: 2,
    },
    rowLabel: {
      ...typography.bodyStrong,
      color: colors.foreground,
    },
    rowValue: {
      ...typography.caption,
      color: colors.mutedForeground,
      lineHeight: 17,
    },
    button: {
      minHeight: 50,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: "transparent",
    },
    buttonInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
    },
    buttonPrimary: {
      backgroundColor: colors.primary,
      ...shadow.raised,
    },
    buttonOutline: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },
    buttonGhost: {
      backgroundColor: "transparent",
    },
    buttonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    buttonText: {
      ...typography.bodyStrong,
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.borderSubtle,
    },
    dividerText: {
      ...typography.caption,
      color: colors.mutedForeground,
    },
    field: {
      gap: 6,
    },
    fieldLabel: {
      ...typography.label,
      color: colors.foreground,
    },
    fieldHint: {
      ...typography.caption,
      color: colors.mutedForeground,
    },
    input: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.lg,
      color: colors.foreground,
      backgroundColor: colors.card,
      ...typography.body,
    },
    centred: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      padding: spacing.xl,
      backgroundColor: colors.muted,
    },
    centredText: {
      ...typography.body,
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: 21,
    },
    banner: {
      backgroundColor: colors.destructiveSurface,
      borderColor: colors.destructive,
      borderWidth: 1,
      borderRadius: radius.sm,
      padding: spacing.md,
    },
    bannerText: {
      ...typography.caption,
      color: colors.destructive,
    },
    emptyRow: {
      ...typography.caption,
      color: colors.mutedForeground,
      paddingVertical: spacing.sm,
    },
  });
