import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { AppButton, Card, ChipSelect, Divider, GoogleButton, PageHeading, TextField } from "@/components/ui";
import { validateRegistration, MIN_PASSWORD_LENGTH, type PublicSignupRole } from "@/lib/validation";
import { useThemedStyles } from "@/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "@/theme/tokens";

const ROLE_OPTIONS: ReadonlyArray<{ label: string; value: PublicSignupRole }> = [
  { label: "Donor", value: "donor" },
  { label: "Volunteer", value: "volunteer" },
  { label: "Beneficiary", value: "beneficiary" },
  { label: "Sponsor", value: "sponsor" },
];

const ROLE_HINTS: Record<PublicSignupRole, string> = {
  donor: "Give money or goods to campaigns and keep your receipts in one place.",
  volunteer: "Apply for campaigns, see your assignments and log your hours.",
  beneficiary: "Ask the foundation for assistance and follow your requests.",
  sponsor: "Support campaigns on behalf of a business or organisation.",
};

export default function RegisterScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<PublicSignupRole | null>(null);
  const [organisationName, setOrganisationName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const isBusy = isSubmitting || isGoogleLoading;

  async function handleSubmit() {
    setError(null);

    const problem = validateRegistration({
      fullName,
      email,
      phoneNumber,
      password,
      confirmPassword,
      role,
      organisationName,
    });
    if (problem || !role) {
      setError(problem ?? "Choose how you are joining TMF.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp({ fullName, email, phoneNumber, password, role, organisationName });
      if (result.needsEmailConfirmation) {
        setConfirmationEmail(email.trim());
      }
      // Otherwise the user is signed in and the role gate in app/_layout.tsx opens their portal.
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignUp() {
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (googleError) {
      setError(googleError instanceof Error ? googleError.message : "Google sign-up failed.");
    } finally {
      setIsGoogleLoading(false);
    }
  }

  if (confirmationEmail) {
    return (
      <View style={styles.centered}>
        <Card style={styles.card}>
          <Text style={styles.eyebrow}>Almost there</Text>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.body}>
            We sent a confirmation link to {confirmationEmail}. Open it to activate your account, then come back
            and sign in with your email and password.
          </Text>
          <AppButton label="Back to sign in" onPress={() => router.replace("/login")} />
        </Card>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PageHeading
          eyebrow="Themba Molefe Foundation"
          title="Join the community"
          subtitle="Create your account to support campaigns, volunteer, or request assistance through the foundation."
        />

        <GoogleButton
          label="Sign up with Google"
          onPress={handleGoogleSignUp}
          disabled={isBusy}
          loading={isGoogleLoading}
        />
        <Text style={styles.hint}>
          Signing up with Google creates a beneficiary account. An administrator can change your role afterwards.
        </Text>

        <Divider text="Or register with email" />

        <View style={styles.form}>
          <TextField
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            autoComplete="name"
            textContentType="name"
            editable={!isBusy}
          />
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
            label="Phone number (optional)"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="e.g. 072 000 0000"
            autoComplete="tel"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            editable={!isBusy}
          />

          <ChipSelect
            label="I am joining as"
            options={ROLE_OPTIONS}
            value={role}
            onChange={setRole}
            hint={role ? ROLE_HINTS[role] : "Administrator accounts are created by the foundation."}
          />

          {role === "sponsor" ? (
            <TextField
              label="Organisation name"
              value={organisationName}
              onChangeText={setOrganisationName}
              placeholder="Your business or organisation"
              autoComplete="organization"
              textContentType="organizationName"
              editable={!isBusy}
            />
          ) : null}

          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
            editable={!isBusy}
          />
          <TextField
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Type your password again"
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            secureTextEntry
            editable={!isBusy}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton
            label={isSubmitting ? "Creating account…" : "Create account"}
            onPress={handleSubmit}
            disabled={isBusy}
            loading={isSubmitting}
          />
        </View>

        <Pressable accessibilityRole="link" onPress={() => router.replace("/login")} style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.link}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
      paddingBottom: spacing.xxl * 1.5,
      gap: spacing.lg,
    },
    form: {
      gap: spacing.md,
    },
    hint: {
      ...typography.caption,
      color: colors.mutedForeground,
      textAlign: "center",
      marginTop: -spacing.sm,
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
