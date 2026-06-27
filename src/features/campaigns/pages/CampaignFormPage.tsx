import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { supabase } from "@/lib/supabaseClient";

export function CampaignFormPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { data: adminProfile, error: adminError } = await supabase.from("administrator_profiles").select("id").single();
    if (adminError || !adminProfile) {
      toast.error("Administrator profile was not found.");
      return;
    }

    const { error } = await supabase.from("campaigns").insert({
      admin_id: adminProfile.id,
      title,
      description,
      location,
      start_date: startDate,
      status: "active",
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Campaign created");
    navigate("/campaigns");
  }

  return (
    <div>
      <h1 className="page-title">Create Campaign</h1>
      <p className="page-description">Administrators can create campaigns for community support activities.</p>

      <Card className="mt-6 max-w-2xl">
        <form className="form-grid" onSubmit={handleSubmit}>
          <Input label="Campaign title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <label className="grid gap-2 text-sm font-medium text-foreground">
            Description
            <textarea className="min-h-28 rounded-lg border border-border bg-card px-3 py-2 text-card-foreground" value={description} onChange={(event) => setDescription(event.target.value)} required />
          </label>
          <Input label="Location" value={location} onChange={(event) => setLocation(event.target.value)} required />
          <Input label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
          <Button type="submit">Save campaign</Button>
        </form>
      </Card>
    </div>
  );
}
