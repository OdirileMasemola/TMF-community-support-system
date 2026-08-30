import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { AppButton, Card } from "@/components/ui";
import { useThemedStyles } from "@/theme/ThemeProvider";
import { spacing, typography, type ThemeColors } from "@/theme/tokens";

/**
 * A signed-in user with no profiles row has no role, so no portal applies.
 * Role selection lives in the web app's registration flow, so send them there.
 */
export default function CompleteProfileScreen() {
  const { signOut, refreshProfile } = useAuth();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.eyebrow}>One more step</Text>
        <Text style={styles.title}>Finish setting up your account</Text>
        <Text style={styles.body}>
          Your account does not have a role yet. Complete your profile on the TMF web dashboard, then come
          back and refresh.
        </Text>
        <AppButton label="I have completed it — refresh" onPress={refreshProfile} />
        <AppButton label="Sign out" variant="outline" onPress={signOut} />
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
