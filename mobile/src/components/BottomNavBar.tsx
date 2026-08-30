import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PortalTab } from "@/navigation/portalTabs";
import { useTheme, useThemedStyles } from "@/theme/ThemeProvider";
import { radius, shadow, spacing, typography, type ThemeColors } from "@/theme/tokens";

/**
 * React Native port of the "Bottom Nav Bar" pill navigation by arunachalam on
 * 21st.dev (https://21st.dev/arunachalam/bottom-nav-bar). The original is a
 * Tailwind + Framer Motion web component, so the layout, spring feel and
 * expand-on-active label behaviour are reproduced here with the Animated API
 * and the TMF design tokens.
 */

const LABEL_MAX_WIDTH = 84;

export function BottomNavBar({ tabs }: { tabs: PortalTab[] }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      toValue: 1,
      stiffness: 300,
      damping: 26,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const activeRoute = useMemo(() => {
    const match = tabs.find((tab) => pathname === tab.route || pathname.startsWith(`${tab.route}/`));
    return match?.route ?? null;
  }, [pathname, tabs]);

  return (
    <Animated.View
      accessibilityRole="tablist"
      accessibilityLabel="Portal navigation"
      pointerEvents="box-none"
      style={[
        styles.dock,
        { paddingBottom: Math.max(insets.bottom, spacing.md) },
        {
          opacity: entrance,
          transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
        },
      ]}
    >
      <View style={styles.bar}>
        {tabs.map((tab) => (
          <NavTab
            key={tab.route}
            tab={tab}
            active={activeRoute === tab.route}
            // replace() keeps the portal a flat set of tabs rather than a
            // growing back stack the user has to unwind.
            onPress={() => router.replace(tab.route as never)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function NavTab({ tab, active, onPress }: { tab: PortalTab; active: boolean; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;

  // Text width cannot be measured before layout, so approximate from the
  // glyph count; labels are short and clipped by overflow either way.
  const labelWidth = useMemo(() => Math.min(LABEL_MAX_WIDTH, tab.label.length * 7.4 + 6), [tab.label]);

  useEffect(() => {
    Animated.spring(progress, {
      toValue: active ? 1 : 0,
      stiffness: 350,
      damping: 32,
      mass: 1,
      useNativeDriver: false,
    }).start();
  }, [active, progress]);

  const animatePress = (toValue: number) => {
    Animated.timing(press, {
      toValue,
      duration: 110,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const Icon = tab.icon;

  return (
    <Animated.View style={{ transform: [{ scale: press }] }}>
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected: active }}
        onPress={onPress}
        onPressIn={() => animatePress(0.97)}
        onPressOut={() => animatePress(1)}
      >
        <View style={styles.tab}>
          {/* Fading a solid layer keeps the tint correct in either theme,
              which interpolating between two colours would not. */}
          <Animated.View style={[styles.tabSurface, { opacity: progress }]} />

          <Icon size={22} strokeWidth={2} color={active ? colors.primary : colors.mutedForeground} />

          <Animated.View
            style={[
              styles.labelClip,
              {
                width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, labelWidth] }),
                marginLeft: progress.interpolate({ inputRange: [0, 1], outputRange: [0, spacing.sm] }),
                opacity: progress,
              },
            ]}
          >
            <Text style={styles.label} numberOfLines={1}>
              {tab.label}
            </Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    dock: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
    },
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      padding: spacing.sm - 2,
      height: 56,
      borderRadius: radius.pill,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      ...shadow.raised,
    },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 44,
      minWidth: 46,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      overflow: "hidden",
    },
    tabSurface: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.primarySurface,
      borderRadius: radius.pill,
    },
    labelClip: {
      overflow: "hidden",
      justifyContent: "center",
    },
    label: {
      ...typography.caption,
      fontWeight: "600",
      color: colors.primary,
    },
  });
