import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { createClient, getSupabaseClientOrNull, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { UserRole } from "@/types/app.types";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
};

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (values: { fullName: string; email: string; phoneNumber: string; password: string; role: UserRole }) => Promise<void>;
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
    const supabase = getSupabaseClientOrNull();
    if (!supabase) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone_number, role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Profile loading failed", error);
      return;
    }

    setProfile(data as Profile);
  }

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured. Add your credentials to .env.local and restart the dev server.");
    }

    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      throw new Error("Supabase client is unavailable.");
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
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

  async function signOut() {
    const supabase = getSupabaseClientOrNull();
    if (!supabase) return;

    await supabase.auth.signOut();
    navigate("/login");
  }

  const value = useMemo(
    () => ({ session, profile, isLoading, signIn, signUp, signOut }),
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
