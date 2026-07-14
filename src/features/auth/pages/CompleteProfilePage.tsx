import { useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthPageShell } from "@/features/auth/components/AuthPageShell";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/app.types";
 // this is the roles array that is used to display the roles in the select dropdown
const roles: { value: UserRole; label: string }[] = [
  { value: "volunteer", label: "Volunteer" },
  { value: "beneficiary", label: "Beneficiary" },
  { value: "donor", label: "Donor" },
  { value: "sponsor", label: "Sponsor" },
];
// this is the complete profile page and it is used to complete  a profile after the user has signed up with email and password for google signin.
export function CompleteProfilePage() {
  const { session, profile, isLoading, completeProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<UserRole>("beneficiary");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleName =
    session?.user.user_metadata?.full_name ?? session?.user.user_metadata?.name ?? "";

  if (isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center px-6">
        <p className="text-sm text-muted-foreground">Loading your account...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (profile) {
    return <Navigate to="/dashboard" replace />;
  }

  // this is the function that is used to handle the submission of the form and the way that we do that is by using the completeProfile function from the useAuth hook that we have setup in the useAuth hook file
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await completeProfile({ fullName: fullName || googleName, phoneNumber, role });
      toast.success("Profile completed. Welcome!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthPageShell
      label="Almost there"
      title="Complete your"
      highlightedTitle="profile"
      subtitle="Tell us a bit more about yourself so we can tailor your experience on the platform."
      maxWidth="lg"
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Input
          label="Full name"
          autoComplete="name"
          value={fullName || googleName}
          onChange={(event) => setFullName(event.target.value)}
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

        <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">
          {isSubmitting ? "Saving..." : "Continue to dashboard"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
