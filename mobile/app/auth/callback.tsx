import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { AppButton, Card, LoadingState } from "@/components/ui";
import { useThemedStyles } from "@/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "@/theme/tokens";

/** How long to wait for the session before offering a way back. */
const WAIT_MS = 10_000;

/**
 * Landing screen for the tmfdashboard://auth/callback deep link that Google
 * sign-in returns to. The code exchange itself happens in
 * AuthProvider.signInWithGoogle; on Android the same link can also open this
 * route, so it only waits here until the session arrives and the role gate in
 * app/_layout.tsx moves the user on to their portal.
 */
export default function AuthCallbackScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ error?: string; error_description?: string }>();
  const styles = useThemedStyles(createStyles);
  const [timedOut, setTimedOut] = useState(false);

  const providerError = params.error_description ?? params.error;

  useEffect(() => {
    if (session || providerError) return;
    const timer = setTimeout(() => setTimedOut(true), WAIT_MS);
    return () => clearTimeout(timer);
  }, [session, providerError]);

  if (!providerError && !timedOut) {
    return <LoadingState label="Finishing sign-in…" />;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.eyebrow}>Sign-in not completed</Text>
        <Text style={styles.body}>
          {providerError
            ? String(providerError).replace(/\+/g, " ")
            : "We could not finish signing you in with Google. Please try again."}
        </Text>
        <AppButton label="Back to sign in" onPress={() => router.replace("/login")} />
      </Card>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: spacing.lg,
      backgroundColor: colors.muted,
    },
    card: {
      gap: spacing.md,
    },
    eyebrow: {
      ...typography.eyebrow,
      color: colors.destructive,
    },
    body: {
      ...typography.body,
      color: colors.foreground,
      lineHeight: 22,
      marginBottom: spacing.xs,
    },
  });
