import { useCallback, useRef, useState } from "react";
import type { PropsWithChildren, ReactElement } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type KeyboardAwareScreenProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /**
   * Distance from the top of the window to this screen. KeyboardAvoidingView
   * measures itself against its parent, so anything above it (a stack header,
   * the portal bar) has to be added back. Measured on layout when omitted.
   */
  keyboardVerticalOffset?: number;
  /** Pads the end of the content by the home-indicator inset. */
  bottomInset?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  showsVerticalScrollIndicator?: boolean;
}>;

/** Scrollable form screen that keeps the focused input above the keyboard. */
export function KeyboardAwareScreen({
  children,
  style,
  contentContainerStyle,
  keyboardVerticalOffset,
  bottomInset = true,
  refreshControl,
  showsVerticalScrollIndicator = false,
}: KeyboardAwareScreenProps) {
  const insets = useSafeAreaInsets();
  const containerRef = useRef<View>(null);
  const [measuredOffset, setMeasuredOffset] = useState(0);

  const measureOffset = useCallback(() => {
    containerRef.current?.measureInWindow((_x, y) => {
      if (Number.isFinite(y)) setMeasuredOffset(Math.max(0, y));
    });
  }, []);

  const flatContent = StyleSheet.flatten(contentContainerStyle) ?? {};
  const basePaddingBottom = flatContent.paddingBottom ?? flatContent.paddingVertical ?? flatContent.padding ?? 0;

  return (
    <View ref={containerRef} style={styles.fill} onLayout={keyboardVerticalOffset === undefined ? measureOffset : undefined}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={keyboardVerticalOffset ?? measuredOffset}
      >
        <ScrollView
          style={[styles.fill, style]}
          contentContainerStyle={[
            styles.content,
            contentContainerStyle,
            bottomInset && typeof basePaddingBottom === "number"
              ? { paddingBottom: basePaddingBottom + insets.bottom }
              : null,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
