import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthDivider } from "@/features/auth/components/AuthDivider";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { toAuthUserMessage } from "@/lib/errors";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
      toast.success("Welcome back!");
    } catch (error) {
      toast.error(toAuthUserMessage(error));
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
      <GoogleSignInButton onClick={handleGoogleSignIn} disabled={isBusy} />

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
        <Button type="submit" disabled={isBusy} className="w-full">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
