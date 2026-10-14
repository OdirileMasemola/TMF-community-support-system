import { Image, StyleSheet, Text, View } from "react-native";
import { useThemedStyles } from "@/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "@/theme/tokens";

const logoImage = require("../../../assets/brand/logo.jpeg");

export function WelcomeHeader() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row} accessibilityRole="header">
      <Image source={logoImage} style={styles.logo} accessibilityLabel="Themba Molefe Foundation logo" />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          Themba Molefe Foundation
        </Text>
        <Text style={styles.system} numberOfLines={1}>
          Community Support System
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    logo: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: "#ffffff" },
    text: { flex: 1 },
    name: { ...typography.heading, color: colors.foreground },
    system: { ...typography.caption, color: colors.mutedForeground, marginTop: 2 },
  });
