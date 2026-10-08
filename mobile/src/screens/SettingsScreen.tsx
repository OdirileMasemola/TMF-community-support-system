import { useState, type ComponentType } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Monitor, Moon, Sun } from "lucide-react-native";
import { useAuth } from "@/auth/AuthProvider";
import { AppButton, Badge, PageHeading, Screen, SectionCard } from "@/components/ui";
import { useUserSettings } from "@/hooks/useUserSettings";
import { formatStatusLabel } from "@/lib/display";
import type { SettingsPatch } from "@/services/settings";
import { portalNameFor, portalSegmentFor } from "@/navigation/portalTabs";
import { useTheme, useThemedStyles, type ThemeMode } from "@/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "@/theme/tokens";

const THEME_OPTIONS: Array<{
  value: ThemeMode;
  label: string;
  hint: string;
  icon: ComponentType<{ size?: number; color?: string }>;
}> = [
  { value: "light", label: "Light", hint: "Always use the light theme", icon: Sun },
  { value: "dark", label: "Dark", hint: "Always use the dark theme", icon: Moon },
  { value: "system", label: "System", hint: "Match your phone's setting", icon: Monitor },
];

type NotificationField = "notify_campaign_updates" | "notify_request_updates" | "notify_donation_updates";

const NOTIFICATION_OPTIONS: Array<{ field: NotificationField; label: string; hint: string }> = [
  { field: "notify_campaign_updates", label: "Campaign updates", hint: "News about campaigns and events" },
  {
    field: "notify_request_updates",
    label: "Request updates",
    hint: "Assistance requests, applications and sponsorship requests",
  },
  { field: "notify_donation_updates", label: "Donation updates", hint: "Donations, receipts and proof-of-payment reviews" },
];

/** Appearance, notification and account settings, shared by all five portals. */
export function SettingsScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const { mode, setMode, colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { settings, query, save } = useUserSettings();
  const [saveError, setSaveError] = useState<string | null>(null);

  const segment = portalSegmentFor(profile?.role);

  async function saveSetting(patch: SettingsPatch, failureMessage: string) {
    setSaveError(null);
    try {
      await save(patch);
    } catch {
      setSaveError(failureMessage);
    }
  }

  function chooseTheme(next: ThemeMode) {
    // Applies at once and is kept on this device even if the account save fails.
    setMode(next);
    void saveSetting(
      { theme_preference: next },
      "Your theme is saved on this device, but not to your account. Please try again later.",
    );
  }

  return (
    <Screen>
      <PageHeading eyebrow="Settings" title="Preferences" subtitle={portalNameFor(profile?.role)} />

      <SectionCard title="Appearance">
        <Text style={styles.sectionHint}>Choose how the app looks on this device.</Text>

        {THEME_OPTIONS.map((option) => {
          const selected = mode === option.value;
          const Icon = option.icon;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.label} theme`}
              onPress={() => chooseTheme(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                <Icon size={17} color={selected ? colors.primaryForeground : colors.mutedForeground} />
              </View>

              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionHint}>{option.hint}</Text>
              </View>

              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </SectionCard>

      <SectionCard title="Notifications">
        <Text style={styles.sectionHint}>Choose which updates you want to hear about. Saved to your account.</Text>

        {NOTIFICATION_OPTIONS.map((option) => (
          <View key={option.field} style={styles.switchRow}>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{option.label}</Text>
              <Text style={styles.optionHint}>{option.hint}</Text>
            </View>
            <Switch
              accessibilityLabel={option.label}
              value={settings?.[option.field] ?? true}
              disabled={!settings}
              onValueChange={(value) =>
                void saveSetting({ [option.field]: value }, "Your notification choice could not be saved. Please try again.")
              }
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.card}
            />
          </View>
        ))}

        {query.isError ? (
          <Text style={styles.errorText}>Your saved settings could not be loaded. Check your connection and open Settings again.</Text>
        ) : null}
        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
      </SectionCard>

      <SectionCard title="Account">
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Signed in as</Text>
          <Text style={styles.accountValue} numberOfLines={1}>
            {profile?.email ?? "—"}
          </Text>
        </View>
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Role</Text>
          <Text style={styles.accountValue}>{formatStatusLabel(profile?.role)}</Text>
        </View>
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Status</Text>
          <Badge label={formatStatusLabel(profile?.account_status)} status={profile?.account_status} />
        </View>

        <AppButton
          label="Edit your profile"
          variant="outline"
          onPress={() => {
            if (segment) router.push(`/${segment}/profile` as never);
          }}
        />
      </SectionCard>

      <AppButton label="Sign out" variant="outline" onPress={signOut} />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    sectionHint: {
      ...typography.caption,
      color: colors.mutedForeground,
      marginBottom: spacing.xs,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.card,
    },
    optionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySurface,
    },
    optionPressed: {
      opacity: 0.75,
    },
    optionIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.muted,
    },
    optionIconSelected: {
      backgroundColor: colors.primary,
    },
    optionText: {
      flex: 1,
      gap: 2,
    },
    optionLabel: {
      ...typography.bodyStrong,
      color: colors.foreground,
    },
    optionHint: {
      ...typography.caption,
      color: colors.mutedForeground,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    radioSelected: {
      borderColor: colors.primary,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    errorText: {
      ...typography.caption,
      color: colors.destructive,
    },
    accountRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    accountLabel: {
      ...typography.caption,
      color: colors.mutedForeground,
    },
    accountValue: {
      ...typography.label,
      color: colors.foreground,
      flexShrink: 1,
      textAlign: "right",
    },
  });
