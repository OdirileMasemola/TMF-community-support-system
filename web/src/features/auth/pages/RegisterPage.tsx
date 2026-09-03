import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthDivider } from "@/features/auth/components/AuthDivider";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { GoogleSignInButton } from "@/features/auth/components/GoogleSignInButton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/app.types";

const roles: { value: UserRole; label: string }[] = [
  { value: "volunteer", label: "Volunteer" },
  { value: "beneficiary", label: "Beneficiary" },
  { value: "donor", label: "Donor" },
  { value: "sponsor", label: "Sponsor" },
];

// this is the register page and it is used to register a new user with email and password
export function RegisterPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<UserRole>("beneficiary");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await signUp({ fullName, email, phoneNumber, password, role });
      toast.success("Account created. Check your email if confirmation is enabled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }
// this is the asyncronous function that is used to handle the google sign-up and the way that we do this is by using the signInWithGoogle function from the useAuth hook that we have setup.
  async function handleGoogleSignUp() {
    setIsGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-up failed");
      setIsGoogleLoading(false);
    }
  }

  const isBusy = isSubmitting || isGoogleLoading;

  return (
    <AuthPageShell
      label="Community Support System"
      title="Join the"
      highlightedTitle="community"
      subtitle="Create your account to support campaigns, volunteer, or request assistance through the foundation."
      maxWidth="lg"
      scrollable
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link className="font-semibold text-primary hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      }
    >
      <GoogleSignInButton
        onClick={handleGoogleSignUp}
        disabled={isBusy}
        label="Sign up with Google"
      />

      <AuthDivider text="Or register with email" />
       
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <Input
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          label="Phone number"
          type="tel"
          autoComplete="tel"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
        />

        <label className="grid gap-2 text-sm font-medium text-foreground">
          I am joining as
          <select
            className={cn(
              "rounded-lg border border-border bg-card px-3 py-2 text-card-foreground outline-none",
              "focus:border-ring focus:ring-2 focus:ring-ring/30",
            )}
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
          >
            {roles.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={8}
        />

        <Button type="submit" disabled={isBusy} className="w-full">
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
