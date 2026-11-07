import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { describeRecoveryFailure, describeRecoveryLinkError, parseRecoveryLink } from "@/auth/recoveryLink";
import { KeyboardAwareScreen } from "@/components/KeyboardAwareScreen";
import { AppButton, Card, LoadingState, PageHeading, SuccessBanner, TextField } from "@/components/ui";
import { MIN_PASSWORD_LENGTH, validateNewPassword } from "@/lib/validation";
import { useThemedStyles } from "@/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "@/theme/tokens";

/** How long to wait for the opening URL before treating the visit as link-less. */
const LINK_WAIT_MS = 4_000;
const INVALID_LINK_MESSAGE = "This reset link is invalid or has expired. Please request a new one.";

type Status = "checking" | "ready" | "invalid" | "updated";

/**
 * Landing screen for the password-reset deep link. Supabase verifies the
 * emailed link and redirects to tmfdashboard://reset-password with either the
 * recovery tokens or an error in the URL fragment. The tokens become a session
 * (that is what lets updateUser change the password); an error is explained
 * with a way to request a new link.
 */
export default function ResetPasswordScreen() {
  const { session, isConfigured, restoreRecoverySession, updatePassword, signOut } = useAuth();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const openingUrl = Linking.useURL();
  // Expo Router exposes the fragment of the opening URL as the "#" param, which
  // is available on the first render even before useURL has resolved.
  const params = useLocalSearchParams<{
    "#"?: string;
    code?: string;
    error?: string;
    error_code?: string;
    error_description?: string;
  }>();

  const [status, setStatus] = useState<Status>("checking");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const confirmRef = useRef<TextInput>(null);
  const handledLink = useRef<string | null>(null);

  // useURL remembers the last URL that opened the app, which could be an older
  // Google sign-in callback; only a URL for this route is trusted.
  const linkSource = openingUrl && openingUrl.includes("reset-password") ? openingUrl : linkFromParams(params);

  useEffect(() => {
    if (status !== "checking") return;

    if (!isConfigured) {
      setLinkError("Password reset is unavailable because Supabase is not configured on this device.");
      setStatus("invalid");
      return;
    }

    // A session already exists (the tokens were applied, or the person is
    // signed in): the password can be changed straight away.
    if (session) {
      setStatus("ready");
      return;
    }

    const link = parseRecoveryLink(linkSource);

    if (link.kind === "error") {
      setLinkError(describeRecoveryLinkError(link));
      setStatus("invalid");
      return;
    }

    if (link.kind === "code") {
      // The app runs the implicit flow, so a one-time code cannot be redeemed here.
      setLinkError("This reset link was not made for the app. Request a new link from the app's sign-in screen.");
      setStatus("invalid");
      return;
    }

    if (link.kind === "tokens") {
      if (handledLink.current === linkSource) return;
      handledLink.current = linkSource;

      let active = true;
      restoreRecoverySession({ accessToken: link.accessToken, refreshToken: link.refreshToken })
        .then(() => {
          if (active) setStatus("ready");
        })
        .catch((error: unknown) => {
          if (!active) return;
          setLinkError(describeRecoveryFailure(error, INVALID_LINK_MESSAGE));
          setStatus("invalid");
        });
      return () => {
        active = false;
      };
    }

    // No link yet. The opening URL can take a moment to arrive on a cold
    // start, so give it a little time before calling the visit invalid.
    const timer = setTimeout(() => {
      setLinkError(INVALID_LINK_MESSAGE);
      setStatus("invalid");
    }, LINK_WAIT_MS);
    return () => clearTimeout(timer);
  }, [status, session, isConfigured, linkSource, restoreRecoverySession]);

  async function handleSubmit() {
    if (isSubmitting) return;

    const problem = validateNewPassword(password, confirmPassword);
    if (problem) {
      setFormError(problem);
      return;
    }
    setFormError(null);

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setPassword("");
      setConfirmPassword("");
      setStatus("updated");
    } catch (error) {
      setFormError(describeRecoveryFailure(error, "Could not update your password. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Ends the recovery session so the next sign-in has to use the new password.
   * The root layout's logout reset moves the app to the sign-in screen once
   * the session is gone.
   */
  async function handleBackToSignIn() {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await signOut();
    } catch {
      // The confirmation stays on screen so the user can try again.
      setIsLeaving(false);
    }
  }

  if (status === "checking") {
    return <LoadingState label="Checking your reset link…" />;
  }

  if (status === "invalid") {
    return (
      <View style={styles.centered}>
        <Card style={styles.card}>
          <Text style={styles.eyebrowError}>Reset link problem</Text>
          <Text style={styles.body}>{linkError ?? INVALID_LINK_MESSAGE}</Text>
          <AppButton label="Request a new link" onPress={() => router.replace("/forgot-password")} />
          <AppButton label="Back to sign in" variant="outline" onPress={() => router.replace("/login")} />
        </Card>
      </View>
    );
  }

  if (status === "updated") {
    return (
      <View style={styles.centered}>
        <Card style={styles.card}>
          <Text style={styles.eyebrow}>All done</Text>
          <Text style={styles.title}>Password updated</Text>
          <SuccessBanner label="Your new password has been saved. Use it the next time you sign in." />
          <Text style={styles.body}>For your security we will sign you out now, so you can sign in with the new password.</Text>
          <AppButton
            label={isLeaving ? "Signing out…" : "Back to sign in"}
            onPress={handleBackToSignIn}
            disabled={isLeaving}
            loading={isLeaving}
          />
        </Card>
      </View>
    );
  }

  return (
    <KeyboardAwareScreen style={styles.root} contentContainerStyle={styles.content}>
      <PageHeading
        eyebrow="Account help"
        title="Choose a new password"
        subtitle={`Use at least ${MIN_PASSWORD_LENGTH} characters. You will sign in with this password from now on.`}
      />

      <View style={styles.form}>
        <TextField
          label="New password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (formError) setFormError(null);
          }}
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          secureTextEntry
          editable={!isSubmitting}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <TextField
          ref={confirmRef}
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            if (formError) setFormError(null);
          }}
          placeholder="Type your new password again"
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          secureTextEntry
          editable={!isSubmitting}
          onSubmitEditing={handleSubmit}
          returnKeyType="go"
        />

        {formError ? <Text style={styles.error}>{formError}</Text> : null}

        <AppButton
          label={isSubmitting ? "Updating password…" : "Update password"}
          onPress={handleSubmit}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
      </View>

      <Pressable accessibilityRole="link" onPress={() => router.replace("/login")} disabled={isSubmitting}>
        <Text style={styles.footerText}>
          Changed your mind? <Text style={styles.link}>Back to sign in</Text>
        </Text>
      </Pressable>
    </KeyboardAwareScreen>
  );
}

/**
 * Rebuilds enough of the opening URL from the route params for the parser.
 * Only used until useURL reports the real URL.
 */
function linkFromParams(params: {
  "#"?: string;
  code?: string;
  error?: string;
  error_code?: string;
  error_description?: string;
}): string | null {
  const query = new URLSearchParams();
  for (const key of ["code", "error", "error_code", "error_description"] as const) {
    const value = params[key];
    if (typeof value === "string" && value) query.set(key, value);
  }
  const search = query.toString();
  const hash = typeof params["#"] === "string" ? params["#"] : "";
  if (!search && !hash) return null;
  return `tmfdashboard://reset-password${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.xl,
      gap: spacing.lg,
    },
    form: {
      gap: spacing.md,
    },
    error: {
      ...typography.caption,
      color: colors.destructive,
    },
    footerText: {
      ...typography.caption,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    link: {
      color: colors.primary,
      fontWeight: "700",
    },
    centered: {
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
      color: colors.primary,
    },
    eyebrowError: {
      ...typography.eyebrow,
      color: colors.destructive,
    },
    title: {
      ...typography.title,
      color: colors.foreground,
    },
    body: {
      ...typography.body,
      color: colors.mutedForeground,
      lineHeight: 21,
      marginBottom: spacing.xs,
    },
  });
