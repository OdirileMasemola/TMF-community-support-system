import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { AppButton, Card, LoadingState } from "@/components/ui";
import { roleHomePath } from "@/lib/display";
import { ThemeProvider, useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "@/theme/tokens";

const PORTAL_SEGMENTS = ["admin", "donor", "volunteer", "beneficiary", "sponsor"] as const;

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
  const { colors: themeColors } = useTheme();

  useEffect(() => {
    if (isLoading) return;

    const current = segments[0];
    const isAuthScreen = current === "login";

    if (!session) {
      if (!isAuthScreen) router.replace("/login");
      return;
    }

    // A failed read is not the same as a missing row, so do not route on it.
    if (profileError) return;

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
    return <LoadingState label="Checking your session…" />;
  }

  if (session && profileError) {
    return <ProfileErrorScreen message={profileError} />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: themeColors.card },
        headerTintColor: themeColors.foreground,
        contentStyle: { backgroundColor: themeColors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="complete-profile" options={{ title: "Complete your profile" }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="donor" options={{ headerShown: false }} />
      <Stack.Screen name="volunteer" options={{ headerShown: false }} />
      <Stack.Screen name="beneficiary" options={{ headerShown: false }} />
      <Stack.Screen name="sponsor" options={{ headerShown: false }} />
    </Stack>
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
