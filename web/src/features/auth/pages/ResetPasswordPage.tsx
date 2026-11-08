import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  describeRecoveryLinkError,
  MIN_PASSWORD_LENGTH,
  parseRecoveryLink,
  validateNewPassword,
} from "@/features/auth/lib/passwordRecovery";
import { toAuthUserMessage } from "@/lib/errors";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";

type LinkStatus = "checking" | "ready" | "invalid" | "updated";

const UNAVAILABLE_MESSAGE = "Password reset is temporarily unavailable. Please try again later.";
const INVALID_LINK_MESSAGE = "This reset link is invalid or has expired. Please request a new one.";

/**
 * Step two of password recovery. Supabase verifies the emailed link and
 * redirects here; supabase-js reads the result out of the URL and signs the
 * user in for the purpose of changing their password. This page waits for
 * that to finish, explains any failure, and only then shows the form.
 */
export function ResetPasswordPage() {
  const { updatePassword, signOut } = useAuth();
  const [status, setStatus] = useState<LinkStatus>("checking");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyLink() {
      const supabase = getSupabaseClientOrNull();
      if (!supabase) {
        setLinkError(UNAVAILABLE_MESSAGE);
        setStatus("invalid");
        return;
      }

      // Supabase reports a failed verification (expired, reused, malformed)
      // as error parameters on the redirect rather than a session.
      const params = parseRecoveryLink(window.location.href);
      if (params.error) {
        setLinkError(describeRecoveryLinkError(params.error));
        setStatus("invalid");
        return;
      }

      try {
        // getSession() resolves after supabase-js has processed the URL, so a
        // usable link has produced a session by the time this returns.
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        if (data.session) {
          setStatus("ready");
          return;
        }

        // A PKCE code that was not exchanged automatically means the code
        // verifier is missing: the link was opened in a different browser
        // from the one that asked for it. Exchanging it here surfaces the
        // exact reason instead of a silent dead end.
        const { code } = parseRecoveryLink(window.location.href);
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!active) return;
          if (!error) {
            setStatus("ready");
            return;
          }
          setLinkError(toAuthUserMessage(error));
          setStatus("invalid");
          return;
        }

        setLinkError(INVALID_LINK_MESSAGE);
        setStatus("invalid");
      } catch (error) {
        if (!active) return;
        setLinkError(toAuthUserMessage(error));
        setStatus("invalid");
      }
    }

    verifyLink();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const problem = validateNewPassword(password, confirmPassword);
    if (problem) {
      setFormError(problem);
      return;
    }
    setFormError(null);

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setPassword("");
      setConfirmPassword("");
      setStatus("updated");
      toast.success("Your password has been updated.");
    } catch (error) {
      setFormError(toAuthUserMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  /** Ends the recovery session so the next sign-in has to use the new password. */
  async function handleContinue() {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await signOut();
    } catch {
      // signOut already navigates to /login on success; a failure here leaves
      // the confirmation on screen so the user can try again.
      setIsLeaving(false);
    }
  }

  const requestNewLink = (
    <p className="text-center text-sm text-muted-foreground">
      Need a new link?{" "}
      <Link className="font-semibold text-primary hover:underline" to="/forgot-password">
        Request another
      </Link>
      {" · "}
      <Link className="font-semibold text-primary hover:underline" to="/login">
        Back to sign in
      </Link>
    </p>
  );

  if (status === "checking") {
    return (
      <AuthPageShell
        label="Account help"
        title="Checking your"
        highlightedTitle="link"
        subtitle="One moment while we verify your password-reset link."
      >
        <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-muted-foreground">
          <Spinner size="sm" />
          Verifying reset link...
        </div>
      </AuthPageShell>
    );
  }

  if (status === "invalid") {
    return (
      <AuthPageShell
        label="Account help"
        title="Link not"
        highlightedTitle="usable"
        subtitle="We could not use this password-reset link."
        footer={requestNewLink}
      >
        <div role="alert" className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm text-card-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <ShieldAlert className="size-4 text-primary" aria-hidden="true" />
            Reset link problem
          </div>
          <p className="text-muted-foreground">{linkError ?? INVALID_LINK_MESSAGE}</p>
        </div>
        <Button to="/forgot-password" className="mt-3 w-full">
          Request a new link
        </Button>
      </AuthPageShell>
    );
  }

  if (status === "updated") {
    return (
      <AuthPageShell
        label="Account help"
        title="Password"
        highlightedTitle="updated"
        subtitle="Your new password has been saved. Use it the next time you sign in."
      >
        <div role="status" className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm text-card-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
            All done
          </div>
          <p className="text-muted-foreground">For your security we will sign you out now, so you can sign in with the new password.</p>
        </div>
        <Button type="button" onClick={handleContinue} disabled={isLeaving} loading={isLeaving} className="mt-3 w-full">
          {isLeaving ? "Signing you out..." : "Continue to sign in"}
        </Button>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      label="Account help"
      title="Choose a new"
      highlightedTitle="password"
      subtitle={`Use at least ${MIN_PASSWORD_LENGTH} characters. You will sign in with this password from now on.`}
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Changed your mind?{" "}
          <Link className="font-semibold text-primary hover:underline" to="/login">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
        <Input
          id="new-password"
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (formError) setFormError(null);
          }}
          disabled={isSubmitting}
          minLength={MIN_PASSWORD_LENGTH}
        />
        <Input
          id="confirm-password"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            if (formError) setFormError(null);
          }}
          disabled={isSubmitting}
          minLength={MIN_PASSWORD_LENGTH}
        />

        {formError ? (
          <p role="alert" className="text-sm text-primary">
            {formError}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting} loading={isSubmitting} className="w-full">
          {isSubmitting ? "Updating password..." : "Update password"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
