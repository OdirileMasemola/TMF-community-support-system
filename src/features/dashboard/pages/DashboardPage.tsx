import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { roleHomePath } from "@/lib/display";

/** Redirect signed-in users to their role-specific dashboard portal. */
export function DashboardPage() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  if (!profile) {
    return <Navigate to="/register/complete-profile" replace />;
  }

  return <Navigate to={roleHomePath(profile.role)} replace />;
}
