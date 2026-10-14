import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "@/theme/tokens";

type Props = {
  label: string;
  hint: string;
  Icon: LucideIcon;
  onPress: () => void;
  role?: "button" | "link";
};

export function InformationLink({ label, hint, Icon, onPress, role = "button" }: Props) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <Icon size={18} color={colors.primary} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
    },
    pressed: { backgroundColor: colors.muted },
    icon: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primarySurface,
    },
    label: { ...typography.bodyStrong, flex: 1, color: colors.foreground },
  });
