import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { roleHomePath } from "@/lib/display";
import { LoadingState } from "@/components/ui/Spinner";

/** Redirect signed-in users to their role-specific dashboard portal. */
export function DashboardPage() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState variant="page" message="Loading dashboard…" />;
  }

  if (!profile) {
    return <Navigate to="/register/complete-profile" replace />;
  }

  return <Navigate to={roleHomePath(profile.role)} replace />;
}
