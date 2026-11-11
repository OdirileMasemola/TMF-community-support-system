import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthDivider } from "@/features/auth/components/AuthDivider";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { ResendConfirmation } from "@/features/auth/components/ResendConfirmation";
import { toAuthUserMessage } from "@/lib/errors";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  /** Set when Supabase refused the sign-in because the address is not confirmed yet. */
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setUnconfirmedEmail(null);

    try {
      await signIn(email.trim(), password);
      toast.success("Welcome back!");
    } catch (error) {
      const message = toAuthUserMessage(error);
      if (message === "Please confirm your email address before signing in.") setUnconfirmedEmail(email.trim());
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }
  // this asynchronous function is used to handle the google sign in and the way that we do that is by using the signals with the useAuth hook and the signInWithGoogle function from the useAuth hook file
  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(toAuthUserMessage(error));
      setIsGoogleLoading(false);
    }
  }

  const isBusy = isSubmitting || isGoogleLoading;
// this is the return statement for the login page and it is used to display the login page and the way that we do that is by using the AuthPageShell component from the AuthPageShell component file and the GoogleSignInButton component from the GoogleSignInButton component file and the Input component from the Input component file and the Button component from the Button component file 
  return (
    <AuthPageShell
      label="Themba Molefe Foundation"
      title="Welcome"
      highlightedTitle="back"
      subtitle="Sign in to access your dashboard and stay connected with the community."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link className="font-semibold text-primary hover:underline" to="/register">
            Create one
          </Link>
        </p>
      }
    >
      <GoogleSignInButton onClick={handleGoogleSignIn} disabled={isBusy} loading={isGoogleLoading} />

      <AuthDivider text="Or sign in with email" />

      <form className="grid gap-3" onSubmit={handleSubmit}>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <div className="-mt-1 flex justify-end">
          <Link className="text-xs font-semibold text-primary hover:underline" to="/forgot-password">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" disabled={isBusy} loading={isSubmitting} className="w-full">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      {unconfirmedEmail ? (
        <div className="grid gap-2 rounded-lg border border-border p-3">
          <p className="text-sm text-foreground">Please check your inbox to verify your email address.</p>
          <ResendConfirmation email={unconfirmedEmail} />
        </div>
      ) : null}
    </AuthPageShell>
  );
}
