import { Navigate, Outlet } from "react-router";
import { LoadingState } from "@/components/ui/Spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function ProtectedRoute() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState variant="page" message="Checking your account…" />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
