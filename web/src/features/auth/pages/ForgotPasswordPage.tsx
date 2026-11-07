import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { validateEmail } from "@/features/auth/lib/passwordRecovery";
import { toAuthUserMessage } from "@/lib/errors";

/**
 * Step one of password recovery: ask Supabase to email a reset link. The
 * confirmation deliberately reads the same whether or not the address has an
 * account, so the form cannot be used to check who is registered.
 */
export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setSubmitError(null);
    const problem = validateEmail(email);
    if (problem) {
      setFieldError(problem);
      return;
    }
    setFieldError(null);

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSentTo(email.trim());
    } catch (error) {
      setSubmitError(toAuthUserMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const backToSignIn = (
    <p className="text-center text-sm text-muted-foreground">
      Remembered it?{" "}
      <Link className="font-semibold text-primary hover:underline" to="/login">
        Back to sign in
      </Link>
    </p>
  );

  if (sentTo) {
    return (
      <AuthPageShell
        label="Account help"
        title="Check your"
        highlightedTitle="email"
        subtitle="If an account exists for that address, a password-reset link is on its way."
        footer={backToSignIn}
      >
        <div
          role="status"
          className="grid gap-3 rounded-lg border border-border bg-card p-4 text-sm text-card-foreground"
        >
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <MailCheck className="size-4 text-primary" aria-hidden="true" />
            Reset email requested
          </div>
          <p className="text-muted-foreground">
            We sent the link to <span className="font-medium text-foreground">{sentTo}</span>. Open it on this device to
            choose a new password. The link expires after a short while, and it can only be used once.
          </p>
          <p className="text-muted-foreground">
            Nothing arrived? Check your spam folder, make sure the address is the one you registered with, then{" "}
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={() => setSentTo(null)}
            >
              try again
            </button>
            .
          </p>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      label="Account help"
      title="Forgot your"
      highlightedTitle="password?"
      subtitle="Enter the email address you registered with and we will send you a link to choose a new password."
      footer={backToSignIn}
    >
      <form className="grid gap-3" onSubmit={handleSubmit} noValidate>
        <Input
          id="forgot-email"
          label="Email address"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (fieldError) setFieldError(null);
          }}
          error={fieldError ?? undefined}
          disabled={isSubmitting}
          aria-invalid={fieldError ? true : undefined}
        />

        {submitError ? (
          <p role="alert" className="text-sm text-primary">
            {submitError}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting} loading={isSubmitting} className="w-full">
          {isSubmitting ? "Sending link..." : "Send reset link"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
