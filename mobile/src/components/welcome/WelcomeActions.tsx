import { StyleSheet, View } from "react-native";
import { AppButton } from "@/components/ui";
import { spacing } from "@/theme/tokens";

type Props = { onSignIn: () => void; onRegister: () => void };

export function WelcomeActions({ onSignIn, onRegister }: Props) {
  return (
    <View style={styles.stack}>
      <AppButton label="Sign In" onPress={onSignIn} />
      <AppButton label="Create an Account" variant="outline" onPress={onRegister} />
    </View>
  );
}

const styles = StyleSheet.create({ stack: { gap: spacing.md } });
