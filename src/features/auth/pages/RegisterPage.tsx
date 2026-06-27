import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { UserRole } from "@/types/app.types";

const roles: UserRole[] = ["volunteer", "beneficiary", "donor", "sponsor"];

export function RegisterPage() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<UserRole>("beneficiary");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <main className="grid min-h-screen place-items-center bg-muted p-5">
      <Card className="w-full max-w-lg">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Community Support System</p>
        <h1 className="mt-2 text-2xl font-bold">Create account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose the role that matches your reason for using the system.</p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          <Input label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="Phone number" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />

          <label className="grid gap-2 text-sm font-medium text-foreground">
            Role
            <select className="rounded-lg border border-border bg-card px-3 py-2 text-card-foreground" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
              {roles.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>

          <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create account"}</Button>
        </form>

        <p className="mt-5 text-sm text-muted-foreground">
          Already registered? <Link className="font-semibold text-primary" to="/login">Login</Link>
        </p>
      </Card>
    </main>
  );
}
