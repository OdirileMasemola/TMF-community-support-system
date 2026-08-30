import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Bell, LogOut, Settings } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthProvider";
import { BottomNavBar } from "@/components/BottomNavBar";
import { OverflowMenu } from "@/components/OverflowMenu";
import { useNotifications } from "@/hooks/useNotifications";
import { getInitials } from "@/lib/display";
import { portalNameFor, portalSegmentFor, portalTabs } from "@/navigation/portalTabs";
import type { UserRole } from "@/types/app.types";
import { useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { radius, spacing, typography, type ThemeColors } from "@/theme/tokens";

const logoImage = require("../../assets/brand/logo.jpeg");

/**
 * Shared chrome for every role portal: brand bar with notifications and
 * account shortcuts, the routed screen, and the docked tab bar.
 */
export function PortalLayout() {
  const { profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();
  const styles = useThemedStyles(createStyles);
  const { colors, isDark } = useTheme();

  const role = profile?.role as UserRole | undefined;
  const tabs = role ? portalTabs[role] : undefined;
  const segment = portalSegmentFor(role);

  const notificationsRoute = segment ? `/${segment}/notifications` : null;
  const profileRoute = segment ? `/${segment}/profile` : null;
  const settingsRoute = segment ? `/${segment}/settings` : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* The bar behind the clock and battery follows the theme, so the system
          icons have to be inverted against it or they vanish into it. */}
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.card} />

      <View style={styles.bar}>
        <Image source={logoImage} style={styles.logo} />

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {profile?.full_name ?? "TMF user"}
          </Text>
          <Text style={styles.portal} numberOfLines={1}>
            {portalNameFor(role)}
          </Text>
        </View>

        {notificationsRoute ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
            onPress={() => router.push(notificationsRoute as never)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.iconButton,
              pathname === notificationsRoute && styles.iconButtonActive,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Bell size={17} color={colors.mutedForeground} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}

        {profileRoute ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Your profile"
            onPress={() => router.push(profileRoute as never)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.avatar,
              pathname === profileRoute && styles.avatarActive,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Text style={styles.avatarText}>{getInitials(profile?.full_name)}</Text>
          </Pressable>
        ) : null}

        <OverflowMenu
          items={[
            {
              label: "Settings",
              icon: Settings,
              onPress: () => {
                if (settingsRoute) router.push(settingsRoute as never);
              },
            },
            { label: "Sign out", icon: LogOut, onPress: signOut, danger: true },
          ]}
        />
      </View>

      {/* The bar above replaces the native header inside a portal. */}
      <View style={styles.body}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.muted },
          }}
        />
        {tabs ? <BottomNavBar tabs={tabs} /> : null}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.card,
    },
    body: {
      flex: 1,
    },
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.card,
      borderBottomColor: colors.borderSubtle,
      borderBottomWidth: 1,
    },
    logo: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      marginRight: spacing.xs,
    },
    identity: {
      flex: 1,
    },
    name: {
      ...typography.bodyStrong,
      color: colors.foreground,
    },
    portal: {
      ...typography.caption,
      color: colors.mutedForeground,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      alignItems: "center",
      justifyContent: "center",
    },
    iconButtonActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    iconButtonPressed: {
      opacity: 0.7,
    },
    badge: {
      position: "absolute",
      top: -5,
      right: -5,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.destructive,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.card,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.card,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      borderWidth: 1,
      borderColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarActive: {
      borderColor: colors.primary,
    },
    avatarText: {
      ...typography.caption,
      fontWeight: "800",
      color: colors.accentForeground,
    },
  });
