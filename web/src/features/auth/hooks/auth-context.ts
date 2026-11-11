import { createContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type { UserRole } from "@/types/app.types";
import type { AccountStatus } from "@/types/database.types";
import type { RegistrationResult } from "@/features/auth/lib/registration";

export type AuthProfile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  account_status: AccountStatus;
  avatar_url: string | null;
  avatar_change_count: number;
};

export type AuthContextValue = {
  session: Session | null;
  profile: AuthProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** API email check, then Supabase signUp. Resolves with whether a confirmation email was sent. */
  signUp: (values: { fullName: string; email: string; phoneNumber: string; password: string; role: UserRole }) => Promise<RegistrationResult>;
  /** Sends the Supabase sign-up confirmation email again. */
  resendConfirmation: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  completeProfile: (values: { fullName: string; phoneNumber: string; role: UserRole; organisationName?: string }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
