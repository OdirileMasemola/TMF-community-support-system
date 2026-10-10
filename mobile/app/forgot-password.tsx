import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { KeyboardAwareScreen } from "@/components/KeyboardAwareScreen";
import { AppButton, PageHeading, SuccessBanner, TextField } from "@/components/ui";
import { validateEmail } from "@/lib/validation";
import { useThemedStyles } from "@/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "@/theme/tokens";

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    const problem = validateEmail(email);
    if (problem) {
      setError(problem);
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setSentTo(email.trim());
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not send the reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAwareScreen style={styles.root} contentContainerStyle={styles.content}>
      <PageHeading
        eyebrow="Account help"
        title="Forgot your password?"
        subtitle="Enter the email address you registered with and we will email you a reset link. The link opens the TMF website."
      />

      {sentTo ? (
        <View style={styles.form}>
          <SuccessBanner label={`If an account exists for ${sentTo}, a reset email is on its way.`} />
          <AppButton label="Back to sign in" onPress={() => router.replace("/login")} />
        </View>
      ) : (
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
            editable={!isSubmitting}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton
            label={isSubmitting ? "Sending…" : "Send reset link"}
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
          />
        </View>
      )}

      <Pressable accessibilityRole="link" onPress={() => router.replace("/login")}>
        <Text style={styles.footerText}>
          Remembered it? <Text style={styles.link}>Sign in</Text>
        </Text>
      </Pressable>
    </KeyboardAwareScreen>
  );
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
  });
