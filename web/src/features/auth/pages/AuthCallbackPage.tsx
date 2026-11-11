import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { toAuthUserMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabaseClient";
import { roleHomePath } from "@/lib/display";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { ResendConfirmation } from "@/features/auth/components/ResendConfirmation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { isEmailVerified, readAuthLinkError, type AuthLinkError } from "@/features/auth/lib/registration";

// Handles the OAuth callback and the email confirmation link: exchange the code for a session,
// then route by profile status. Expired or invalid confirmation links get a way to request a new one.
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { profile, isLoading } = useAuth();
  const [hasExchanged, setHasExchanged] = useState(false);
  const [linkError] = useState<AuthLinkError | null>(() =>
    readAuthLinkError(window.location.search, window.location.hash),
  );

  useEffect(() => {
    if (linkError) return;

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

        // Verified means Supabase set email_confirmed_at; nothing the client sends counts.
        const fragmentType = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("type");
        if ((fragmentType === "signup" || params.get("type") === "signup") && isEmailVerified(data.session.user)) {
          toast.success("Your email address is verified.");
        }

        setHasExchanged(true);
      } catch (error) {
        toast.error(toAuthUserMessage(error));
        navigate("/login", { replace: true });
      }
    }

    handleCallback();
  }, [linkError, navigate]);

  useEffect(() => {
    if (!hasExchanged || isLoading) return;

    if (!profile) {
      navigate("/register/complete-profile", { replace: true });
      return;
    }

    navigate(roleHomePath(profile.role), { replace: true });
  }, [hasExchanged, isLoading, profile, navigate]);

  if (linkError) {
    return (
      <AuthPageShell
        label="Email verification"
        title={linkError.kind === "expired" ? "Link" : "Link not"}
        highlightedTitle={linkError.kind === "expired" ? "expired" : "valid"}
        subtitle={linkError.message}
        footer={
          <p className="text-center text-sm text-muted-foreground">
            Already verified?{" "}
            <Link className="font-semibold text-primary hover:underline" to="/login">
              Sign in
            </Link>
          </p>
        }
      >
        <ResendConfirmation />
      </AuthPageShell>
    );
  }

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
