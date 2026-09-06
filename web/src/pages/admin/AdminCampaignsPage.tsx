import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { campaignStatusLabel, formatCurrency, formatShortDate } from "@/lib/display";
import { toUserMessage } from "@/lib/errors";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { createCampaign, fetchCampaigns } from "@/services/campaigns";
import { uploadPublicImage } from "@/services/storage";

export function AdminCampaignsPage() {
  const queryClient = useQueryClient();
  const { roleProfileId, session } = useRoleProfile();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [publishNow, setPublishNow] = useState(true);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const { data: campaigns = [], isLoading, isError } = useQuery({
    queryKey: ["admin-campaigns"],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchCampaigns(),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!roleProfileId) throw new Error("Administrator profile was not found.");
      if (!title.trim() || !description.trim() || !location.trim()) {
        throw new Error("Title, description, and location are required.");
      }
      if (!startDate) throw new Error("Please choose a start date.");

      const parsedGoal = Number(goal.replace(/[^0-9.]/g, ""));
      let imageUrl: string | null = null;

      if (thumbnail) {
        const uploaded = await uploadPublicImage({
          bucket: "campaign-images",
          userId: session?.user.id ?? roleProfileId,
          file: thumbnail,
          folder: "thumbnails",
          maxBytes: 5 * 1024 * 1024,
        });
        imageUrl = uploaded.publicUrl;
      }

      return createCampaign({
        admin_id: roleProfileId,
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        start_date: startDate,
        end_date: endDate || null,
        category: category.trim() || null,
        funding_goal: Number.isFinite(parsedGoal) && parsedGoal > 0 ? parsedGoal : null,
        image_url: imageUrl,
        status: publishNow ? "active" : "draft",
        is_public: publishNow,
      });
    },
    onSuccess: async () => {
      setComposing(false);
      setTitle("");
      setDescription("");
      setLocation("");
      setCategory("");
      setGoal("");
      setStartDate("");
      setEndDate("");
      setPublishNow(true);
      setThumbnail(null);
      setThumbnailPreview(null);
      toast.success("Campaign created.");
      await queryClient.invalidateQueries({ queryKey: ["admin-campaigns"] });
      await queryClient.invalidateQueries({ queryKey: ["public-campaigns"] });
    },
    onError: (error) => {
      const raw = error instanceof Error ? error.message : "";
      toast.error(
        raw.includes("required") || raw.includes("start date") || raw.includes("MB") || raw.includes("JPG")
          ? raw
          : toUserMessage("Could not create the campaign."),
      );
    },
  });

  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active").length;
  const pendingReview = campaigns.filter((campaign) => campaign.status === "draft").length;
  const completed = campaigns.filter((campaign) => campaign.status === "closed").length;
  const totalRaised = campaigns.reduce((sum, campaign) => sum + Number(campaign.amount_raised ?? 0), 0);

  return (
    <AdminPageShell
      label="Operations"
      title="Campaign Management"
      description="Create, review, and monitor foundation campaigns, funding progress, and campaign deadlines."
      actions={
        <Button type="button" onClick={() => setComposing((current) => !current)}>
          {composing ? "Cancel" : "Create campaign"}
        </Button>
      }
    >
      {composing ? (
        <DashboardCard>
          <CardHeader>
            <CardTitle>New campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                createMutation.mutate();
              }}
            >
              <Input label="Campaign title" value={title} onChange={(event) => setTitle(event.target.value)} required />
              <Input label="Location" value={location} onChange={(event) => setLocation(event.target.value)} required />
              <Input label="Category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="e.g. Food Support" />
              <Input label="Funding goal" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. 15000" />
              <Input label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
              <Input label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              <label className="grid gap-2 text-sm font-medium text-foreground md:col-span-2">
                Description
                <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} required />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Campaign thumbnail
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setThumbnail(file);
                    setThumbnailPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
                <span className="text-xs font-normal text-muted-foreground">
                  JPG, PNG, or WebP. This image appears on the public website campaign cards.
                </span>
              </label>
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Campaign thumbnail preview" className="h-32 w-full rounded-lg object-cover" />
              ) : null}
              <label className="flex items-center gap-2 text-sm text-foreground md:col-span-2">
                <input type="checkbox" checked={publishNow} onChange={(event) => setPublishNow(event.target.checked)} />
                Publish on the website now
              </label>
              <div className="md:col-span-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Save campaign"}
                </Button>
              </div>
            </form>
          </CardContent>
        </DashboardCard>
      ) : null}

      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Active campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : activeCampaigns}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : pendingReview}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : completed}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total raised</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : formatCurrency(totalRaised)}</p>
          </CardContent>
        </DashboardCard>
      </div>

      <DashboardCard>
        <CardHeader>
          <CardTitle>All campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={isLoading}
            isError={isError}
            isEmpty={campaigns.length === 0}
            emptyMessage="No campaigns found."
            errorMessage="We could not load campaigns right now. Please try again shortly."
            loadingMessage="Loading campaigns..."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Raised</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {campaign.image_url ? (
                          <img
                            src={campaign.image_url}
                            alt=""
                            width={48}
                            height={48}
                            className="size-12 rounded-md object-cover"
                          />
                        ) : (
                          <span className="size-12 rounded-md bg-muted" aria-hidden="true" />
                        )}
                        <span>{campaign.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AdminStatusBadge status={campaignStatusLabel(campaign.status)} />
                    </TableCell>
                    <TableCell>{campaign.location}</TableCell>
                    <TableCell>{formatCurrency(campaign.amount_raised)}</TableCell>
                    <TableCell>{formatCurrency(campaign.funding_goal)}</TableCell>
                    <TableCell>{formatShortDate(campaign.end_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataState>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}
