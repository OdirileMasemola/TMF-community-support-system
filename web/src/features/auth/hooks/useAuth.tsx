import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createClient, getSupabaseClientOrNull, isSupabaseConfigured } from "@/lib/supabaseClient";
import { roleHomePath } from "@/lib/display";
import { ensureRoleProfile, fetchProfile } from "@/services/profiles";
import { isPublicSignupRole, type UserRole } from "@/types/app.types";
import type { AccountStatus } from "@/types/database.types";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  account_status: AccountStatus;
  avatar_url: string | null;
  avatar_change_count: number;
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
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toProfile(data: NonNullable<Awaited<ReturnType<typeof fetchProfile>>>): Profile {
  return {
    id: data.id,
    full_name: data.full_name,
    email: data.email,
    phone_number: data.phone_number,
    role: data.role,
    account_status: data.account_status,
    avatar_url: data.avatar_url ?? null,
    avatar_change_count: data.avatar_change_count ?? 0,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured());
  const navigate = useNavigateSafe();
  const queryClient = useQueryClient();

  const loadProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      try {
        const data = await queryClient.fetchQuery({
          queryKey: ["profile", userId],
          queryFn: () => fetchProfile(userId),
          staleTime: 30_000,
        });

        if (!data) {
          setProfile(null);
          return null;
        }

        const next = toProfile(data);
        setProfile(next);
        return next;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Profile loading failed", error);
        }
        throw error;
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const client = createClient();

    client.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user.id) {
        try {
          await loadProfile(data.session.user.id);
        } catch {
          setProfile(null);
        }
      }
      setIsLoading(false);
    });

    // Keep this callback synchronous: supabase-js holds its auth lock while it runs,
    // and loadProfile calls getSession() via the API client, which would deadlock.
    const { data: listener } = client.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);

      if (!nextSession?.user.id) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        setIsLoading(false);
        return;
      }

      const userId = nextSession.user.id;
      setTimeout(() => {
        loadProfile(userId)
          .catch(() => setProfile(null))
          .finally(() => setIsLoading(false));
      }, 0);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured()) {
        throw new Error("Sign in is temporarily unavailable. Please try again later.");
      }

      const supabase = getSupabaseClientOrNull();
      if (!supabase) {
        throw new Error("Sign in is temporarily unavailable. Please try again later.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user?.id) {
        const nextProfile = await loadProfile(data.user.id);
        navigate(roleHomePath(nextProfile?.role));
        return;
      }

      navigate("/dashboard");
    },
    [loadProfile, navigate],
  );

  const signUp = useCallback(
    async (values: { fullName: string; email: string; phoneNumber: string; password: string; role: UserRole }) => {
      if (!isPublicSignupRole(values.role)) {
        throw new Error("That account type cannot be created from registration.");
      }

      if (!isSupabaseConfigured()) {
        throw new Error("Registration is temporarily unavailable. Please try again later.");
      }

      const supabase = getSupabaseClientOrNull();
      if (!supabase) {
        throw new Error("Registration is temporarily unavailable. Please try again later.");
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
    },
    [navigate],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error("Sign in is temporarily unavailable. Please try again later.");
    }

    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      throw new Error("Sign in is temporarily unavailable. Please try again later.");
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  }, []);

  const sessionUserId = session?.user.id;
  const sessionUserEmail = session?.user.email;

  const completeProfile = useCallback(
    async (values: { fullName: string; phoneNumber: string; role: UserRole; organisationName?: string }) => {
      if (!isPublicSignupRole(values.role)) {
        throw new Error("That account type cannot be selected here.");
      }

      const supabase = getSupabaseClientOrNull();
      if (!supabase || !sessionUserId) {
        throw new Error("You must be signed in to complete your profile.");
      }

      const existing = await fetchProfile(sessionUserId);
      if (existing?.role) {
        navigate(roleHomePath(existing.role));
        return;
      }

      const { error } = await supabase.from("profiles").upsert({
        id: sessionUserId,
        full_name: values.fullName,
        email: sessionUserEmail ?? "",
        phone_number: values.phoneNumber || null,
        role: values.role,
        account_status: "pending",
      });

      if (error) throw error;

      await ensureRoleProfile(sessionUserId, values.role, values.organisationName);
      queryClient.removeQueries({ queryKey: ["profile", sessionUserId] });
      await loadProfile(sessionUserId);
      navigate(roleHomePath(values.role));
    },
    [loadProfile, navigate, queryClient, sessionUserEmail, sessionUserId],
  );

  const refreshProfile = useCallback(async () => {
    if (!sessionUserId) return;
    queryClient.removeQueries({ queryKey: ["profile", sessionUserId] });
    await loadProfile(sessionUserId);
  }, [loadProfile, queryClient, sessionUserId]);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClientOrNull();
    if (!supabase) return;

    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    queryClient.clear();
    navigate("/login");
  }, [navigate, queryClient]);

  const value = useMemo(
    () => ({ session, profile, isLoading, signIn, signUp, signInWithGoogle, completeProfile, signOut, refreshProfile }),
    [session, profile, isLoading, signIn, signUp, signInWithGoogle, completeProfile, signOut, refreshProfile],
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
