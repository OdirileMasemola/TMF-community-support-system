import { StyleSheet, Text } from "react-native";
import Constants from "expo-constants";
import { useThemedStyles } from "@/theme/ThemeProvider";
import { typography, type ThemeColors } from "@/theme/tokens";

export function WelcomeFooter() {
  const styles = useThemedStyles(createStyles);
  const version = Constants.expoConfig?.version;
  return (
    <Text style={styles.footer}>
      © Themba Molefe Foundation{version ? ` · Version ${version}` : ""}
    </Text>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    footer: { ...typography.caption, color: colors.mutedForeground, textAlign: "center" },
  });
