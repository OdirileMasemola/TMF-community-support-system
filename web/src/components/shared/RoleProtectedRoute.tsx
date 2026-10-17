import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "@/types/app.types";
import { LoadingState } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { roleHomePath } from "@/lib/display";

type RoleProtectedRouteProps = {
  allowedRoles: UserRole[];
};

export function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState variant="page" message="Checking your account…" />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return <Navigate to="/register/complete-profile" replace />;
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={roleHomePath(profile.role)} replace />;
  }

  return <Outlet />;
}
