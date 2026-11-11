import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { REGISTRATION_COPY, RESEND_COOLDOWN_SECONDS } from "@/auth/registration";
import { AppButton, TextField } from "@/components/ui";
import { useThemedStyles } from "@/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "@/theme/tokens";

/**
 * "Resend verification email" with a client-side cooldown. Supabase also rate-limits resends on
 * the server; the cooldown just avoids pointless requests.
 */
export function ResendConfirmation({ email: initialEmail, startCoolingDown = false }: { email?: string; startCoolingDown?: boolean }) {
  const { resendConfirmation } = useAuth();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [secondsLeft, setSecondsLeft] = useState(startCoolingDown ? RESEND_COOLDOWN_SECONDS : 0);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function handleResend() {
    setMessage(null);
    if (!email.trim()) {
      setMessage({ tone: "error", text: REGISTRATION_COPY.invalidEmail });
      return;
    }
    setIsSending(true);
    try {
      await resendConfirmation(email);
      setMessage({ tone: "ok", text: REGISTRATION_COPY.resent });
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not send the email. Please try again." });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <View style={styles.container}>
      {initialEmail ? null : (
        <TextField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
      )}
      <AppButton
        label={secondsLeft > 0 ? `Resend available in ${secondsLeft}s` : "Resend verification email"}
        variant="outline"
        onPress={() => void handleResend()}
        disabled={isSending || secondsLeft > 0}
        loading={isSending}
      />
      {message ? <Text style={message.tone === "error" ? styles.error : styles.ok}>{message.text}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { gap: spacing.sm },
    error: { ...typography.caption, color: colors.destructive },
    ok: { ...typography.caption, color: colors.mutedForeground },
  });
