import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { toAuthUserMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabaseClient";
import { roleHomePath } from "@/lib/display";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Handles the OAuth callback: exchange code for session, then route by profile status.
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { profile, isLoading } = useAuth();
  const [hasExchanged, setHasExchanged] = useState(false);

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createClient();
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!data.session) {
          toast.error("Sign-in was cancelled or failed.");
          navigate("/login", { replace: true });
          return;
        }

        setHasExchanged(true);
      } catch (error) {
        toast.error(toAuthUserMessage(error));
        navigate("/login", { replace: true });
      }
    }

    handleCallback();
  }, [navigate]);

  useEffect(() => {
    if (!hasExchanged || isLoading) return;

    if (!profile) {
      navigate("/register/complete-profile", { replace: true });
      return;
    }

    navigate(roleHomePath(profile.role), { replace: true });
  }, [hasExchanged, isLoading, profile, navigate]);

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background px-6">
      <div className="text-center">
        <div className="mx-auto size-10 animate-spin rounded-full border-4 border-border border-t-primary" />
        <p className="mt-4 text-sm font-medium text-foreground">Signing you in...</p>
        <p className="mt-1 text-xs text-muted-foreground">Please wait while we set up your session.</p>
      </div>
    </div>
  );
}
