import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/features/auth/hooks/useAuth";

export function CampaignListPage() {
  const { profile } = useAuth();
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
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
        {profile?.role === "administrator" && <Link to="/campaigns/new"><Button>Create campaign</Button></Link>}
      </div>

      <div className="card-grid mt-6">
        {isLoading && <p>Loading campaigns...</p>}
        {!isLoading && campaigns.length === 0 && <Card>No campaigns yet.</Card>}
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <p className="text-xs font-semibold uppercase text-primary">{campaign.status}</p>
            <h2 className="mt-2 text-lg font-bold">{campaign.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{campaign.description}</p>
            <p className="mt-4 text-sm text-muted-foreground">{campaign.location} - {campaign.start_date}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
