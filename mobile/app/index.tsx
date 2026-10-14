import { Redirect } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";
import { SessionSplash } from "@/components/SessionSplash";
import { roleHomePath } from "@/lib/display";

/**
 * Launch route. The root layout only mounts the navigator once the saved
 * session has been restored, so this decides the first screen in one step
 * instead of showing a placeholder and waiting for the gate to redirect.
 */
export default function Index() {
  const { session, profile, profileError, isLoading } = useAuth();

  if (isLoading) return <SessionSplash />;
  if (!session) return <Redirect href="/welcome" />;
  // A failed profile read is handled by the error screen in the root layout.
  if (profileError) return <SessionSplash />;
  if (!profile) return <Redirect href="/complete-profile" />;
  return <Redirect href={roleHomePath(profile.role) as never} />;
}
