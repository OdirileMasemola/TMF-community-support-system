import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { AuthContext, type AuthProfile } from "@/features/auth/hooks/auth-context";
import { createClient, getSupabaseClientOrNull, isSupabaseConfigured } from "@/lib/supabaseClient";
import { roleHomePath } from "@/lib/display";
import { ensureRoleProfile, fetchProfile } from "@/services/profiles";
import { isPublicSignupRole, type UserRole } from "@/types/app.types";
import { registerWithEmail, resendSignupConfirmation, type RegistrationResult } from "@/features/auth/lib/registration";

/** Where the confirmation (and Google) links land; also where an expired link is handled. */
export const AUTH_CALLBACK_PATH = "/auth/callback";

/** Where Supabase sends the user after they click the reset link in their email. */
export const PASSWORD_RESET_PATH = "/reset-password";

function toProfile(data: NonNullable<Awaited<ReturnType<typeof fetchProfile>>>): AuthProfile {
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
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(() => isSupabaseConfigured());
  const navigate = useNavigateSafe();
  const queryClient = useQueryClient();
  // The auth listener below is subscribed once; it reads the latest navigate
  // through this ref so a route change does not re-subscribe it.
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const loadProfile = useCallback(
    async (userId: string): Promise<AuthProfile | null> => {
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

      // The reset email may land on the Site URL (e.g. "/") rather than the
      // reset page when the redirect is not allow-listed. supabase-js still
      // reads the tokens from the URL and tells us it was a recovery link, so
      // move the user on to the page where they can set a new password.
      if (event === "PASSWORD_RECOVERY" && window.location.pathname !== PASSWORD_RESET_PATH) {
        navigateRef.current(PASSWORD_RESET_PATH, { replace: true });
      }

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

      // API check (format, mail DNS, domain policy) first, then Supabase signUp.
      const result: RegistrationResult = await registerWithEmail(supabase, values, {
        emailRedirectTo: `${window.location.origin}${AUTH_CALLBACK_PATH}`,
      });

      if (result.userId) {
        // Email confirmation is switched off in Supabase: the user is already signed in.
        const nextProfile = await loadProfile(result.userId);
        navigate(roleHomePath(nextProfile?.role));
      }
      return result;
    },
    [loadProfile, navigate],
  );

  const resendConfirmation = useCallback(async (email: string) => {
    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      throw new Error("Email verification is temporarily unavailable. Please try again later.");
    }
    await resendSignupConfirmation(supabase, email, `${window.location.origin}${AUTH_CALLBACK_PATH}`);
  }, []);

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

  /**
   * Supabase sends the email and verifies the link; the app never sees a
   * token until the user lands on the reset page. The same success response
   * is returned for unknown addresses, so nothing here reveals whether an
   * account exists.
   */
  const requestPasswordReset = useCallback(async (email: string) => {
    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      throw new Error("Password reset is temporarily unavailable. Please try again later.");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${PASSWORD_RESET_PATH}`,
    });
    if (error) throw error;
  }, []);

  /**
   * Only works while a session exists: the recovery link signs the user in
   * for exactly this purpose. The reset page signs the user out afterwards so
   * the next sign-in has to use the new password.
   */
  const updatePassword = useCallback(async (newPassword: string) => {
    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      throw new Error("Password reset is temporarily unavailable. Please try again later.");
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }, []);

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
    () => ({
      session,
      profile,
      isLoading,
      signIn,
      signUp,
      resendConfirmation,
      signInWithGoogle,
      completeProfile,
      requestPasswordReset,
      updatePassword,
      signOut,
      refreshProfile,
    }),
    [
      session,
      profile,
      isLoading,
      signIn,
      signUp,
      resendConfirmation,
      signInWithGoogle,
      completeProfile,
      requestPasswordReset,
      updatePassword,
      signOut,
      refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useNavigateSafe(): NavigateFunction {
  try {
    return useNavigate();
  } catch {
    return (() => undefined) as NavigateFunction;
  }
}
