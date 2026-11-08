import { useContext } from "react";
import { AuthContext } from "@/features/auth/hooks/auth-context";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
