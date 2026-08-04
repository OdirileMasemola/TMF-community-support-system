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

// the auth context value is the type of auth context that is used to provide the auth context to the app
type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (values: { fullName: string; email: string; phoneNumber: string; password: string; role: UserRole }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  completeProfile: (values: { fullName: string; phoneNumber: string; role: UserRole }) => Promise<void>;
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

    // this is the listener for the auth state change
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

  // this is the function that is used to load the profile
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

  // this is the function that is used to sign in with email and password and how we do that is by using the supabase auth.signInWithPassword method
  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured. Add your credentials to .env.local and restart the dev server.");
    }
// this is the supabase client that is used to sign in with email and password
    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      throw new Error("Supabase client is unavailable.");
    }
// this is the error that is used to sign in with email and password
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    navigate("/admin/dashboard");
  }
// this is the function that is used to sign up with email and password and how we do that is by using the supabase auth.signUp method
  async function signUp(values: { fullName: string; email: string; phoneNumber: string; password: string; role: UserRole }) {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured. Add your credentials to .env.local and restart the dev server.");
    }
// this is the supabase client that is used to sign up with email and password
    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      throw new Error("Supabase client is unavailable.");
    }
// this is the error that is used to sign up with email and password
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
// this is the function that is used to sign in with google and how we do that is by using the supabase auth.signInWithOAuth method and redirecting to the callback page
  async function signInWithGoogle() {
    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured. Add your credentials to .env.local and restart the dev server.");
    }
    // this is the supabase client that is used to sign in with google
    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      throw new Error("Supabase client is unavailable.");
    }
      // this is error that is used to sign in with google and what it does is that it redirects to the callback pag.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  }

  // this is the function that is used to complete the profile and how we do that is by using the supabase profiles table and upserting the profile
  async function completeProfile(values: { fullName: string; phoneNumber: string; role: UserRole }) {
    // this is the supabase client that is used to complete the profile
    const supabase = getSupabaseClientOrNull();
    if (!supabase || !session?.user.id) {
      throw new Error("You must be signed in to complete your profile.");
    }
      // this is the error that is used to make the profile complete and what it does is that it upserts the profile into the profiles table
    const { error } = await supabase.from("profiles").upsert({
      id: session.user.id,
      full_name: values.fullName,
      email: session.user.email ?? "",
      phone_number: values.phoneNumber || null,
      role: values.role,
    });

    if (error) throw error;
    await loadProfile(session.user.id);
    navigate("/dashboard");
  }
 // this is an asynchronous function that is used to sign out and the way we do that is by using the supabase auth.signout function and redirecting to the login page
  async function signOut() {
    const supabase = getSupabaseClientOrNull();
    if (!supabase) return;

    await supabase.auth.signOut();
    navigate("/login");
  }
   // this is basically the value that is used to provide the auth context to the applicaton.
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
// this basic function is used to navigate to the page and its used to prevent error when the user is not logged in and iis not redirected to the login page.
function useNavigateSafe() {
  try {
    return useNavigate();
  } catch {
    return () => undefined;
  }
}
