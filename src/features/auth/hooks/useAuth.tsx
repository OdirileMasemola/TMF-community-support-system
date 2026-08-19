import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { createClient, getSupabaseClientOrNull, isSupabaseConfigured } from "@/lib/supabaseClient";
import { roleHomePath } from "@/lib/display";
import { ensureRoleProfile, fetchProfile } from "@/services/profiles";
import type { UserRole } from "@/types/app.types";
import type { AccountStatus } from "@/types/database.types";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  account_status: AccountStatus;
};

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (values: { fullName: string; email: string; phoneNumber: string; password: string; role: UserRole }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  completeProfile: (values: { fullName: string; phoneNumber: string; role: UserRole; organisationName?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigateSafe();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    const client = createClient();

    async function loadSession() {
      const { data } = await client.auth.getSession();
      setSession(data.session);
      if (data.session?.user.id) {
        await loadProfile(data.session.user.id);
      }
      setIsLoading(false);
    }

    loadSession();

    const { data: listener } = client.auth.onAuthStateChange(async (_event: string, nextSession: Session | null) => {
      setSession(nextSession);
      if (nextSession?.user.id) {
        await loadProfile(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProfile(userId: string) {
    try {
      const data = await fetchProfile(userId);
      if (!data) {
        setProfile(null);
        return;
      }
      setProfile({
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        phone_number: data.phone_number,
        role: data.role,
        account_status: data.account_status,
      });
    } catch (error) {
      console.error("Profile loading failed", error);
    }
  }

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured. Add your credentials to .env.local and restart the dev server.");
    }

    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      throw new Error("Supabase client is unavailable.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    if (data.user?.id) {
      await loadProfile(data.user.id);
      const nextProfile = await fetchProfile(data.user.id);
      navigate(roleHomePath(nextProfile?.role));
      return;
    }

    navigate("/dashboard");
  }

  async function signUp(values: { fullName: string; email: string; phoneNumber: string; password: string; role: UserRole }) {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured. Add your credentials to .env.local and restart the dev server.");
    }

    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      throw new Error("Supabase client is unavailable.");
    }

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName,
          phone_number: values.phoneNumber,
          role: values.role,
        },
      },
    });

    if (error) throw error;
    navigate("/login");
  }

  async function signInWithGoogle() {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured. Add your credentials to .env.local and restart the dev server.");
    }

    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      throw new Error("Supabase client is unavailable.");
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  }

  async function completeProfile(values: {
    fullName: string;
    phoneNumber: string;
    role: UserRole;
    organisationName?: string;
  }) {
    const supabase = getSupabaseClientOrNull();
    if (!supabase || !session?.user.id) {
      throw new Error("You must be signed in to complete your profile.");
    }

    const { error } = await supabase.from("profiles").upsert({
      id: session.user.id,
      full_name: values.fullName,
      email: session.user.email ?? "",
      phone_number: values.phoneNumber || null,
      role: values.role,
      account_status: "pending",
    });

    if (error) throw error;

    await ensureRoleProfile(session.user.id, values.role, values.organisationName);
    await loadProfile(session.user.id);
    navigate(roleHomePath(values.role));
  }

  async function signOut() {
    const supabase = getSupabaseClientOrNull();
    if (!supabase) return;

    await supabase.auth.signOut();
    navigate("/login");
  }

  const value = useMemo(
    () => ({ session, profile, isLoading, signIn, signUp, signInWithGoogle, completeProfile, signOut }),
    [session, profile, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

function useNavigateSafe() {
  try {
    return useNavigate();
  } catch {
    return () => undefined;
  }
}
