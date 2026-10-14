import { useCallback } from "react";
import { Alert } from "react-native";
import { useAuth } from "@/auth/AuthProvider";

/**
 * The sign-out button handler. It calls the existing AuthProvider signOut; the
 * root layout moves to the welcome screen once the session is actually gone,
 * so a failure leaves the user where they are with an explanation.
 */
export function useSignOut() {
  const { signOut } = useAuth();
  return useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert(
        "Could not sign out",
        error instanceof Error && error.message
          ? `${error.message}\n\nCheck your connection and try again.`
          : "Check your connection and try again.",
      );
    }
  }, [signOut]);
}
