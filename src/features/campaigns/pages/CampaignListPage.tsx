import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSupabaseClientOrNull, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function CampaignListPage() {
  const { profile } = useAuth();
  const supabaseReady = isSupabaseConfigured();

  const { data: campaigns = [], isLoading, isError, error } = useQuery({
    queryKey: ["campaigns"],
    enabled: supabaseReady,
    queryFn: async () => {
      const client = getSupabaseClientOrNull();
      if (!client) return [];

      const { data, error: queryError } = await client
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;
      return data;
    },
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-description">View active campaigns and campaign details.</p>
        </div>
        {profile?.role === "administrator" && (
          <Link to="/admin/campaigns/new">
            <Button>Create campaign</Button>
          </Link>
        )}
      </div>

      {!supabaseReady ? (
        <Card className="mt-6">
          <p className="text-sm text-muted-foreground">
            Campaign data will appear here once Supabase is configured. For now, this page is using placeholder
            layout only.
          </p>
        </Card>
      ) : null}

      {isError ? (
        <Card className="mt-6">
          <p className="text-sm text-muted-foreground">Could not load campaigns: {(error as Error).message}</p>
        </Card>
      ) : null}

      <div className="card-grid mt-6">
        {supabaseReady && isLoading && <p>Loading campaigns...</p>}
        {supabaseReady && !isLoading && campaigns.length === 0 && <Card>No campaigns yet.</Card>}
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <p className="text-xs font-semibold uppercase text-primary">{campaign.status}</p>
            <h2 className="mt-2 text-lg font-bold">{campaign.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{campaign.description}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              {campaign.location} - {campaign.start_date}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
