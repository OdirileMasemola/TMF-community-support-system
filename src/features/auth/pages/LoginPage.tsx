import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn(email, password);
      toast.success("Login successful");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-5">
      <Card className="w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Themba Molefe Foundation</p>
        <h1 className="mt-2 text-2xl font-bold">Login</h1>
        <p className="mt-2 text-sm text-slate-600">Access your role-based dashboard.</p>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <Input label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</Button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          No account yet? <Link className="font-semibold text-teal-700" to="/register">Create one</Link>
        </p>
      </Card>
    </main>
  );
}
