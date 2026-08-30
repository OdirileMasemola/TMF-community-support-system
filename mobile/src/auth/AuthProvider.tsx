import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { Session } from "@supabase/supabase-js";
import { createClient, getSupabaseClientOrNull, isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchProfile } from "@/services/profiles";
import type { UserRole } from "@/types/app.types";
import type { AccountStatus } from "@/types/database.types";

export type Profile = {
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
  /** Set when the profile row could not be read, as opposed to not existing. */
  profileError: string | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  /**
   * Distinguishes "this user has no profile row" (null, a real state that sends
   * them to complete their profile) from "the profile could not be read"
   * (an error). Collapsing the two makes a database failure look like a new user.
   */
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const data = await fetchProfile(userId);
      setProfileError(null);
      setProfile(
        data
          ? {
              id: data.id,
              full_name: data.full_name,
              email: data.email,
              phone_number: data.phone_number,
              role: data.role,
              account_status: data.account_status,
            }
          : null,
      );
    } catch (error) {
      setProfile(null);
      setProfileError(describeProfileError(error));
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const client = createClient();
    let active = true;

    async function loadSession() {
      const { data } = await client.auth.getSession();
      if (!active) return;

      setSession(data.session);
      if (data.session?.user.id) {
        // The error is already recorded in state; swallow it so startup completes.
        await loadProfile(data.session.user.id).catch(() => undefined);
      }
      if (active) setIsLoading(false);
    }

    loadSession();

    const { data: listener } = client.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return;

      setSession(nextSession);
      if (nextSession?.user.id) {
        await loadProfile(nextSession.user.id).catch(() => undefined);
      } else {
        setProfile(null);
        setProfileError(null);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [isConfigured, loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = getSupabaseClientOrNull();
    if (!client) {
      throw new Error("Supabase is not configured. Add your credentials to mobile/.env.local and restart Expo.");
    }

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // The auth listener also fires, but loading the profile here means the
    // navigation gate has a role to work with on the very next render.
    if (data.user?.id) {
      await loadProfile(data.user.id);
    }
  }, [loadProfile]);

  /**
   * The web flow redirects to window.location.origin, which does not exist here.
   * Instead Supabase hands back an authorisation URL, we host it in the system
   * browser, and the tmfdashboard:// deep link returns the code to exchange.
   */
  const signInWithGoogle = useCallback(async () => {
    const client = getSupabaseClientOrNull();
    if (!client) {
      throw new Error("Supabase is not configured. Add your credentials to mobile/.env.local and restart Expo.");
    }

    const redirectTo = Linking.createURL("auth/callback");

    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        // Without this the SDK tries to navigate the page itself, which is a no-op on native.
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data.url) throw new Error("Google sign-in is unavailable. Please try again.");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== "success") {
      // Dismissed or cancelled: not an error worth surfacing.
      return;
    }

    const { params, errorCode } = Linking.parse(result.url) as {
      queryParams?: Record<string, string> | null;
      params?: Record<string, string> | null;
      errorCode?: string | null;
    } & ReturnType<typeof Linking.parse>;

    if (errorCode) throw new Error(errorCode);

    const returned = (params ?? {}) as Record<string, string | undefined>;
    const code = returned.code ?? extractFragmentParam(result.url, "code");

    if (code) {
      const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
      if (exchangeError) throw exchangeError;
      return;
    }

    // Implicit flow: tokens arrive in the URL fragment rather than as a code.
    const accessToken = extractFragmentParam(result.url, "access_token");
    const refreshToken = extractFragmentParam(result.url, "refresh_token");

    if (accessToken && refreshToken) {
      const { error: sessionError } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (sessionError) throw sessionError;
      return;
    }

    throw new Error("Google sign-in did not return a session. Please try again.");
  }, []);

  const signOut = useCallback(async () => {
    const client = getSupabaseClientOrNull();
    if (!client) return;

    await client.auth.signOut();
    setSession(null);
    setProfile(null);
    setProfileError(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) {
      await loadProfile(session.user.id).catch(() => undefined);
    }
  }, [session, loadProfile]);

  const value = useMemo(
    () => ({
      session,
      profile,
      profileError,
      isLoading,
      isConfigured,
      signIn,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }),
    [session, profile, profileError, isLoading, isConfigured, signIn, signInWithGoogle, signOut, refreshProfile],
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

/**
 * Turns a Postgres/Supabase failure into something a user can act on. Grant and
 * policy problems are configuration, not something retrying will fix, so they
 * get named explicitly rather than surfacing raw SQL wording.
 */
function describeProfileError(error: unknown): string {
  const code = typeof error === "object" && error !== null ? (error as { code?: string }).code : undefined;

  if (code === "42501") {
    return "Your account could not be loaded because the database denied access to the profiles table. An administrator needs to grant the authenticated role SELECT on public.profiles.";
  }

  if (code === "PGRST301" || code === "42P01") {
    return "Your account could not be loaded because the profiles table is unavailable. Please contact an administrator.";
  }

  return "Your account could not be loaded. Please check your connection and try again.";
}

/** Supabase may return OAuth results in the URL fragment, which Linking.parse ignores. */
function extractFragmentParam(url: string, key: string): string | undefined {
  const fragment = url.split("#")[1];
  if (!fragment) return undefined;
  return new URLSearchParams(fragment).get(key) ?? undefined;
}
