import { Link } from "react-router";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function AssistanceRequestsPage() {
  const { profile } = useAuth();

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Assistance Requests</h1>
          <p className="page-description">Beneficiaries can submit and track support requests.</p>
        </div>
        {profile?.role === "beneficiary" && <Link to="/assistance/new"><Button>New request</Button></Link>}
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-bold">Module skeleton</h2>
        <p className="mt-2 text-slate-600">Build request lists, request status tracking, and document verification here.</p>
      </Card>
    </div>
  );
}
