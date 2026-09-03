import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function ProtectedRoute() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8">Loading account...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
