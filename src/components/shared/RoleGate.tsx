import type { PropsWithChildren } from "react";
import type { UserRole } from "@/types/app.types";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Card } from "@/components/ui/Card";

type RoleGateProps = PropsWithChildren<{
  allowedRoles: UserRole[];
}>;

export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const { profile } = useAuth();

  if (!profile || !allowedRoles.includes(profile.role)) {
    return (
      <Card>
        <h2 className="text-lg font-bold">Access denied</h2>
        <p className="mt-2 text-slate-600">Your role does not have permission to open this page.</p>
      </Card>
    );
  }

  return <>{children}</>;
}
