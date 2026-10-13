import type { PropsWithChildren, ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { radius, shadow, spacing, typography, type ThemeColors } from "@/theme/tokens";

/**
 * Bottom sheet that opens one record (a notification, a request…) over the
 * list it came from. Tap the backdrop, the close button or Android back to dismiss.
 */
export function DetailSheet({
  visible,
  onClose,
  eyebrow,
  title,
  subtitle,
  footer,
  children,
}: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}>) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close details" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
            >
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

/** Label / value pairs inside a DetailSheet. */
export function DetailRows({ rows }: { rows: Array<{ label: string; value: string }> }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.rows}>
      {rows.map((row, index) => (
        <View key={row.label} style={[styles.row, index === rows.length - 1 && styles.rowLast]}>
          <Text style={styles.rowLabel}>{row.label}</Text>
          <Text style={styles.rowValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, justifyContent: "flex-end" },
    backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
    sheet: {
      maxHeight: "85%",
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      paddingTop: spacing.sm,
      ...shadow.raised,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    headerText: { flex: 1 },
    eyebrow: { ...typography.eyebrow, color: colors.primary },
    title: { ...typography.heading, color: colors.foreground, marginTop: spacing.xs },
    subtitle: { ...typography.caption, color: colors.mutedForeground, marginTop: spacing.xs },
    close: {
      width: 32,
      height: 32,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      alignItems: "center",
      justifyContent: "center",
    },
    closePressed: { opacity: 0.7 },
    body: { flexGrow: 0 },
    bodyContent: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.lg },
    footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.sm },
    rows: { borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.md },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    rowLast: { borderBottomWidth: 0 },
    rowLabel: { ...typography.caption, color: colors.mutedForeground },
    rowValue: { ...typography.label, color: colors.foreground, flexShrink: 1, textAlign: "right" },
  });
