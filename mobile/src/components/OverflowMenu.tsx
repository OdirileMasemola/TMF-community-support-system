import { useState } from "react";
import type { ComponentType } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MoreVertical } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { radius, shadow, spacing, typography, type ThemeColors } from "@/theme/tokens";

export type OverflowMenuItem = {
  label: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  onPress: () => void;
  /** Renders the row in the destructive colour, e.g. sign out. */
  danger?: boolean;
};

/**
 * Kebab button plus the sheet it opens. React Native has no popover, so this
 * is a transparent modal with a full-screen backdrop that closes on tap.
 */
export function OverflowMenu({ items }: { items: OverflowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More options"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
      >
        <MoreVertical size={18} color={colors.mutedForeground} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close menu">
          {/* Stop taps inside the sheet from closing it. */}
          <Pressable
            style={[styles.sheet, { marginTop: insets.top + 52 }]}
            onPress={(event) => event.stopPropagation()}
          >
            {items.map((item, index) => {
              const Icon = item.icon;
              const tint = item.danger ? colors.destructive : colors.foreground;

              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="menuitem"
                  onPress={() => {
                    setOpen(false);
                    item.onPress();
                  }}
                  style={({ pressed }) => [
                    styles.item,
                    index === items.length - 1 && styles.itemLast,
                    pressed && styles.itemPressed,
                  ]}
                >
                  <Icon size={17} color={tint} />
                  <Text style={[styles.itemLabel, { color: tint }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    trigger: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      alignItems: "center",
      justifyContent: "center",
    },
    triggerPressed: {
      opacity: 0.7,
    },
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlay,
      alignItems: "flex-end",
    },
    sheet: {
      marginRight: spacing.lg,
      minWidth: 208,
      borderRadius: radius.md,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingVertical: spacing.xs,
      overflow: "hidden",
      ...shadow.raised,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    itemLast: {
      borderBottomWidth: 0,
    },
    itemPressed: {
      backgroundColor: colors.muted,
    },
    itemLabel: {
      ...typography.bodyStrong,
    },
  });
