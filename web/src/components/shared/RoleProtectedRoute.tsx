import { Navigate, Outlet } from "react-router-dom";
import type { UserRole } from "@/types/app.types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { roleHomePath } from "@/lib/display";

type RoleProtectedRouteProps = {
  allowedRoles: UserRole[];
};

export function RoleProtectedRoute({ allowedRoles }: RoleProtectedRouteProps) {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8" role="status" aria-live="polite">
        <p className="text-sm text-muted-foreground">Checking your account…</p>
      </div>
    );
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
