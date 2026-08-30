import { useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/auth/AuthProvider";
import { AppButton, Divider, GoogleButton, TextField } from "@/components/ui";
import { useThemedStyles } from "@/theme/ThemeProvider";
import { radius, shadow, spacing, typography, type ThemeColors } from "@/theme/tokens";

const authImage = require("../assets/brand/auth.png");
const logoImage = require("../assets/brand/logo.jpeg");

export default function LoginScreen() {
  const { signIn, signInWithGoogle, isConfigured } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isBusy = isSubmitting || isGoogleLoading;

  async function handleSubmit() {
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
      // Navigation is handled by the role gate in app/_layout.tsx.
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Sign in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (googleError) {
      setError(googleError instanceof Error ? googleError.message : "Google sign-in failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      {/* The hero image sits under the clock and battery here, so the system
          icons need the light treatment instead of the portals' dark one. */}
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Mobile counterpart of the web auth page's side image panel. */}
      <ImageBackground source={authImage} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroScrim} />
        <SafeAreaView edges={["top"]} style={styles.heroContent}>
          <View style={styles.brandRow}>
            <Image source={logoImage} style={styles.logo} />
            <Text style={styles.brandText}>
              <Text style={styles.brandAccent}>TMF</Text> Community Support
            </Text>
          </View>
          <Text style={styles.heroHeadline}>Community support starts with connection.</Text>
        </SafeAreaView>
      </ImageBackground>

      <KeyboardAvoidingView style={styles.sheetWrapper} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headingBlock}>
            <Text style={styles.eyebrow}>Themba Molefe Foundation</Text>
            <Text style={styles.title}>
              Welcome <Text style={styles.titleAccent}>back</Text>
            </Text>
            <Text style={styles.subtitle}>
              Sign in to access your dashboard and stay connected with the community.
            </Text>
          </View>

          <GoogleButton onPress={handleGoogleSignIn} disabled={isBusy} loading={isGoogleLoading} />

          <Divider text="Or sign in with email" />

          <View style={styles.form}>
            <TextField
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              editable={!isBusy}
            />

            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              secureTextEntry
              editable={!isBusy}
              onSubmitEditing={handleSubmit}
              returnKeyType="go"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppButton
              label={isSubmitting ? "Signing in…" : "Sign in"}
              onPress={handleSubmit}
              disabled={isBusy}
              loading={isSubmitting}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don&apos;t have an account? Create one on the TMF web dashboard.
            </Text>
          </View>

          {!isConfigured ? (
            <Text style={styles.notice}>
              Supabase credentials are missing. Add EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to mobile/.env.local, then restart Expo.
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      // Sits behind the hero photo, so it stays dark in either theme.
      backgroundColor: "#222222",
    },
    hero: {
      height: 260,
      justifyContent: "flex-end",
    },
    heroImage: {
      resizeMode: "cover",
    },
    heroScrim: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(34, 34, 34, 0.55)",
    },
    heroContent: {
      padding: spacing.xl,
      gap: spacing.lg,
      justifyContent: "space-between",
      flex: 1,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    logo: {
      width: 38,
      height: 38,
      borderRadius: radius.sm,
    },
    brandText: {
      ...typography.bodyStrong,
      color: "#ffffff",
    },
    brandAccent: {
      color: "#bbcde5",
      fontWeight: "800",
    },
    heroHeadline: {
      ...typography.display,
      color: "#ffffff",
      maxWidth: 320,
    },
    sheetWrapper: {
      flex: 1,
      marginTop: -spacing.xl,
    },
    sheet: {
      flex: 1,
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.lg + 8,
      borderTopRightRadius: radius.lg + 8,
      ...shadow.card,
    },
    sheetContent: {
      padding: spacing.xl,
      paddingBottom: spacing.xxl * 1.5,
      gap: spacing.lg,
    },
    headingBlock: {
      gap: spacing.xs,
    },
    eyebrow: {
      ...typography.eyebrow,
      color: colors.primary,
    },
    title: {
      ...typography.title,
      color: colors.foreground,
      marginTop: spacing.xs,
    },
    titleAccent: {
      color: colors.primary,
    },
    subtitle: {
      ...typography.body,
      color: colors.mutedForeground,
      lineHeight: 21,
    },
    form: {
      gap: spacing.md,
    },
    error: {
      ...typography.caption,
      color: colors.destructive,
    },
    footer: {
      borderTopColor: colors.borderSubtle,
      borderTopWidth: 1,
      paddingTop: spacing.lg,
    },
    footerText: {
      ...typography.caption,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    notice: {
      ...typography.caption,
      color: colors.warning,
      textAlign: "center",
    },
  });
