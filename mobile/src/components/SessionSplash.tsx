import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "@/theme/tokens";

const logoImage = require("../../assets/brand/logo.jpeg");

/** Neutral branded placeholder shown while the saved session is restored. */
export function SessionSplash() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.root} accessible accessibilityLabel="Loading Themba Molefe Foundation" accessibilityRole="progressbar">
      <Image source={logoImage} style={styles.logo} />
      <Text style={styles.name}>Themba Molefe Foundation</Text>
      <ActivityIndicator color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, backgroundColor: colors.muted },
    logo: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: "#ffffff" },
    name: { ...typography.heading, color: colors.foreground, marginTop: spacing.md, textAlign: "center" },
    spinner: { marginTop: spacing.lg },
  });
