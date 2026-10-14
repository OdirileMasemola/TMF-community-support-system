import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { CommunityBenefits } from "@/components/welcome/CommunityBenefits";
import { WelcomeActions } from "@/components/welcome/WelcomeActions";
import { WelcomeFooter } from "@/components/welcome/WelcomeFooter";
import { WelcomeHeader } from "@/components/welcome/WelcomeHeader";
import { WelcomeHero } from "@/components/welcome/WelcomeHero";
import { WelcomeInfoLinks } from "@/components/welcome/WelcomeInfoLinks";
import { useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { spacing, type ThemeColors } from "@/theme/tokens";

/**
 * Public entry point. The role gate in app/_layout.tsx sends anyone without a
 * session here, and sends signed-in users straight on to their portal.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <WelcomeHeader />
        <WelcomeHero />
        <WelcomeActions onSignIn={() => router.push("/login")} onRegister={() => router.push("/register")} />
        <CommunityBenefits />
        <WelcomeInfoLinks onOpenHelp={() => router.push("/help")} />
        <View style={styles.spacer} />
        <WelcomeFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.muted },
    content: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.md, gap: spacing.xl },
    spacer: { flexGrow: 1 },
  });
