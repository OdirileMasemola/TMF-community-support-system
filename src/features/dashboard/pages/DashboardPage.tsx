import { Card } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/hooks/useAuth";

const stats = [
  { label: "Active campaigns", value: "0" },
  { label: "Assistance requests", value: "0" },
  { label: "Donations", value: "R0" },
  { label: "Sponsorships", value: "R0" },
];

export function DashboardPage() {
  const { profile } = useAuth();

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-description">Welcome back, {profile?.full_name}. This page will show role-based summaries.</p>

      <div className="card-grid mt-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="text-lg font-bold">Next build step</h2>
        <p className="mt-2 text-slate-600">Connect this dashboard to Supabase counts for users, campaigns, donations, sponsorships, and assistance requests.</p>
      </Card>
    </div>
  );
}
