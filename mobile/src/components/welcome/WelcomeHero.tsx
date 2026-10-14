import { StyleSheet, Text, View } from "react-native";
import { HeartHandshake } from "lucide-react-native";
import { useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { radius, shadow, spacing, typography, type ThemeColors } from "@/theme/tokens";

export function WelcomeHero() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.card}>
      {/* Restrained decoration: two soft brand-tinted circles behind the content. */}
      <View style={[styles.orb, styles.orbLarge]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbSmall]} pointerEvents="none" />
      <View style={styles.badge}>
        <HeartHandshake size={14} color={colors.primary} />
        <Text style={styles.badgeText}>Tomorrow is one dream away</Text>
      </View>
      <Text style={styles.title} accessibilityRole="header">
        Together, we can make a difference.
      </Text>
      <Text style={styles.body}>
        Connect with community support, discover opportunities to help, and be part of meaningful change with the
        Themba Molefe Foundation.
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      overflow: "hidden",
      borderRadius: radius.lg,
      padding: spacing.xl,
      gap: spacing.md,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.card,
    },
    orb: { position: "absolute", borderRadius: radius.pill, backgroundColor: colors.primarySurface },
    orbLarge: { width: 220, height: 220, top: -110, right: -70 },
    orbSmall: { width: 120, height: 120, bottom: -60, left: -40, backgroundColor: colors.secondarySurface },
    badge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.primarySurface,
    },
    badgeText: { ...typography.label, color: colors.primary },
    title: { ...typography.display, color: colors.foreground, lineHeight: 34 },
    body: { ...typography.body, color: colors.mutedForeground, lineHeight: 22 },
  });
