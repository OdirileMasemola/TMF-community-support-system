import { Linking, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { CircleHelp, Mail, ShieldCheck } from "lucide-react-native";
import { InformationLink } from "@/components/welcome/InformationLink";
import { HELP_CONTACT } from "@/data/helpContent";
import { WEB_APP_URL } from "@/lib/links";
import { useThemedStyles } from "@/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "@/theme/tokens";

/** The website's existing public privacy policy page. */
export const PRIVACY_POLICY_URL = `${WEB_APP_URL}/privacy-policy`;

/**
 * "Need a hand?" links. Every destination already exists: the in-app Help
 * screen, the foundation's published contact email and the website's privacy
 * policy. There is no Terms of Use content yet, so no link is shown for it.
 */
export function WelcomeInfoLinks({ onOpenHelp }: { onOpenHelp: () => void }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Need a hand?</Text>
      <InformationLink label="Help & FAQ" hint="Opens guides and answers to common questions" Icon={CircleHelp} onPress={onOpenHelp} />
      <InformationLink
        label="Contact Us"
        hint={`Emails the foundation at ${HELP_CONTACT.email}`}
        Icon={Mail}
        role="link"
        onPress={() => Linking.openURL(`mailto:${HELP_CONTACT.email}`).catch(() => undefined)}
      />
      <InformationLink
        label="Privacy Policy"
        hint="Opens the privacy policy on the TMF website"
        Icon={ShieldCheck}
        role="link"
        onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL).catch(() => undefined)}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      padding: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    title: { ...typography.label, color: colors.mutedForeground, padding: spacing.md, paddingBottom: spacing.xs },
  });
