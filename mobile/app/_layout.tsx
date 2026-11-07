import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, PASSWORD_RESET_ROUTE, useAuth } from "@/auth/AuthProvider";
import { SessionSplash } from "@/components/SessionSplash";
import { AppButton, Card } from "@/components/ui";
import { useAccountThemeSync } from "@/hooks/useUserSettings";
import { roleHomePath } from "@/lib/display";
import { noTransition, pushTransition, swapTransition } from "@/navigation/transitions";
import { useLogoutReset } from "@/navigation/useLogoutReset";
import { ThemeProvider, useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "@/theme/tokens";

const PORTAL_SEGMENTS = ["admin", "donor", "volunteer", "beneficiary", "sponsor"] as const;
/** Screens for people who are not signed in; a signed-in user is sent on to their portal. */
const SIGNED_OUT_SEGMENTS = ["welcome", "login", "register", "forgot-password", "auth"];
/**
 * Screens anyone may open without a session. The reset-password screen is
 * public (the emailed link opens it with no session) but deliberately not a
 * signed-out screen: the link signs the user in so the password can be
 * changed, and they must stay here until that is done.
 */
const PUBLIC_SEGMENTS = [...SIGNED_OUT_SEGMENTS, "help", PASSWORD_RESET_ROUTE];

export default function RootLayout() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
    [],
  );

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ThemedStatusBar />
            <RootNavigator />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/** Default for the screens outside a portal; portals set their own. */
function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

function RootNavigator() {
  const { session, profile, profileError, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors: themeColors, isDark } = useTheme();
  useAccountThemeSync();

  // The navigator paints its own backdrop between screens. Left on the
  // library default it is light grey, which flashes during every transition
  // (and glares in dark mode), so it follows the app palette instead.
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: themeColors.primary,
        background: themeColors.background,
        card: themeColors.card,
        text: themeColors.foreground,
        border: themeColors.borderSubtle,
        notification: themeColors.destructive,
      },
    };
  }, [isDark, themeColors]);
  const currentSegment = segments[0] ?? "";
  useLogoutReset(
    session,
    isLoading,
    PUBLIC_SEGMENTS.includes(currentSegment),
    // After a password reset the recovery session is ended on purpose; land on
    // sign-in so the new password can be used straight away.
    currentSegment === PASSWORD_RESET_ROUTE ? "/login" : "/welcome",
  );

  useEffect(() => {
    if (isLoading) return;

    const current = segments[0];
    // The launch route (app/index) picks the first screen itself; redirecting
    // from here as well would navigate twice.
    if (current === undefined) return;
    const isAuthScreen = SIGNED_OUT_SEGMENTS.includes(current ?? "");

    if (!session) {
      if (!PUBLIC_SEGMENTS.includes(current ?? "")) router.replace("/welcome");
      return;
    }

    // A failed read is not the same as a missing row, so do not route on it.
    if (profileError) return;

    // Changing a password does not need a profile; leave the reset screen alone.
    if (current === PASSWORD_RESET_ROUTE) return;

    // Signed in but no profile row: role is unknown, so no portal can be chosen.
    if (!profile) {
      if (current !== "complete-profile") router.replace("/complete-profile");
      return;
    }

    const home = roleHomePath(profile.role);
    const allowedSegment = home.split("/")[1];
    const isInSomePortal = PORTAL_SEGMENTS.includes(current as (typeof PORTAL_SEGMENTS)[number]);

    if (isAuthScreen || current === "complete-profile" || current === undefined) {
      router.replace(home);
      return;
    }

    // Landed in another role's portal, e.g. via a deep link.
    if (isInSomePortal && current !== allowedSegment) {
      router.replace(home);
    }
  }, [isLoading, session, profile, profileError, segments, router]);

  if (isLoading) {
    return <SessionSplash />;
  }

  // A password reset only needs the recovery session, not the profile row.
  if (session && profileError && currentSegment !== PASSWORD_RESET_ROUTE) {
    return <ProfileErrorScreen message={profileError} />;
  }

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <View style={[rootStyles.navigatorBackdrop, { backgroundColor: themeColors.background }]}>
        <Stack
          screenOptions={{
            ...pushTransition,
            headerStyle: { backgroundColor: themeColors.card },
            headerTintColor: themeColors.foreground,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: themeColors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false, ...noTransition }} />
          {/* Reached by replace (launch, sign-out), so it fades in. */}
          <Stack.Screen name="welcome" options={{ headerShown: false, ...swapTransition }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ title: "Create account" }} />
          <Stack.Screen name="forgot-password" options={{ title: "Reset password" }} />
          {/* Opened from the emailed link, so there is no screen to swipe back to. */}
          <Stack.Screen name="reset-password" options={{ title: "New password", ...swapTransition }} />
          <Stack.Screen name="auth/callback" options={{ headerShown: false, ...swapTransition }} />
          <Stack.Screen name="help" options={{ title: "Help & FAQ" }} />
          <Stack.Screen name="complete-profile" options={{ title: "Complete your profile", ...swapTransition }} />
          {/* Signing in replaces the auth screens with a portal: fade, no swipe-back. */}
          <Stack.Screen name="admin" options={{ headerShown: false, ...swapTransition }} />
          <Stack.Screen name="donor" options={{ headerShown: false, ...swapTransition }} />
          <Stack.Screen name="volunteer" options={{ headerShown: false, ...swapTransition }} />
          <Stack.Screen name="beneficiary" options={{ headerShown: false, ...swapTransition }} />
          <Stack.Screen name="sponsor" options={{ headerShown: false, ...swapTransition }} />
        </Stack>
      </View>
    </NavigationThemeProvider>
  );
}

function ProfileErrorScreen({ message }: { message: string }) {
  const { refreshProfile, signOut } = useAuth();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.errorScreen}>
      <Card style={styles.errorCard}>
        <Text style={styles.errorEyebrow}>Cannot open your dashboard</Text>
        <Text style={styles.errorBody}>{message}</Text>
        <AppButton label="Try again" onPress={refreshProfile} />
        <AppButton label="Sign out" variant="outline" onPress={signOut} />
      </Card>
    </View>
  );
}

const rootStyles = StyleSheet.create({
  navigatorBackdrop: { flex: 1 },
});

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    errorScreen: {
      flex: 1,
      justifyContent: "center",
      padding: spacing.lg,
      backgroundColor: colors.muted,
    },
    errorCard: {
      gap: spacing.md,
    },
    errorEyebrow: {
      ...typography.eyebrow,
      color: colors.destructive,
    },
    errorBody: {
      ...typography.body,
      color: colors.foreground,
      lineHeight: 22,
      marginBottom: spacing.xs,
    },
  });
