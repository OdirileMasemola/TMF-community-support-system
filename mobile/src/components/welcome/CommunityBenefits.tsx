import { StyleSheet, Text, View } from "react-native";
import { BellRing, HandHeart, LifeBuoy, type LucideIcon } from "lucide-react-native";
import { useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "@/theme/tokens";

/** Each benefit maps to features the portals already provide. */
const BENEFITS: ReadonlyArray<{ title: string; body: string; Icon: LucideIcon }> = [
  {
    title: "Find Support",
    body: "Request assistance and follow your requests and programmes as a beneficiary.",
    Icon: LifeBuoy,
  },
  {
    title: "Make a Difference",
    body: "Donate to campaigns, volunteer your time or sponsor someone in the community.",
    Icon: HandHeart,
  },
  {
    title: "Stay Connected",
    body: "Get notifications about your requests, donations and applications in one place.",
    Icon: BellRing,
  },
];

export function CommunityBenefits() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>What you can do</Text>
      {BENEFITS.map(({ title, body, Icon }) => (
        <View key={title} style={styles.row} accessible accessibilityLabel={`${title}. ${body}`}>
          <View style={styles.iconChip}>
            <Icon size={20} color={colors.primary} />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: { gap: spacing.md },
    eyebrow: { ...typography.eyebrow, color: colors.mutedForeground },
    row: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
    iconChip: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primarySurface,
    },
    text: { flex: 1, gap: 2 },
    title: { ...typography.bodyStrong, color: colors.foreground },
    body: { ...typography.caption, fontSize: 13, lineHeight: 19, color: colors.mutedForeground },
  });
