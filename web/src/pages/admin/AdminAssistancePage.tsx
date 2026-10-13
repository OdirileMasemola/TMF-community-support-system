import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { DetailDrawer, DetailList } from "@/components/shared/DetailDrawer";
import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { formatShortDate, formatStatusLabel, requestStatusLabel } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchAllAssistanceRequests, updateAssistanceRequest } from "@/services/assistance";
import type { RequestStatus } from "@/types/database.types";

const reviewStatuses: RequestStatus[] = ["pending", "under_review", "approved", "rejected", "completed"];

export function AdminAssistancePage() {
  const queryClient = useQueryClient();
  const { roleProfileId } = useRoleProfile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<RequestStatus>("pending");
  const [notes, setNotes] = useState("");

  const { data: requests = [], isLoading, isError } = useQuery({
    queryKey: ["admin-assistance-requests"],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchAllAssistanceRequests(100),
  });

  const selected = requests.find((request) => request.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    setStatus(selected.status);
    setNotes(selected.admin_notes ?? "");
  }, [selected]);

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      await updateAssistanceRequest(selected.id, {
        status,
        admin_notes: notes.trim() || null,
        reviewed_by: roleProfileId ?? null,
        reviewed_at: new Date().toISOString(),
      });
    },
    onSuccess: async () => {
      toast.success("Assistance request updated");
      setSelectedId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-assistance-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not update the request"),
  });

  const pending = requests.filter((request) => request.status === "pending").length;

  return (
    <AdminPageShell
      label="Operations"
      title="Assistance Requests"
      description="Review beneficiary requests for support, record notes, and update their status."
    >
      <DashboardCard>
        <CardHeader>
          <CardTitle>
            Requests{" "}
            {pending > 0 ? <span className="text-sm font-normal text-muted-foreground">· {pending} pending</span> : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={isLoading}
            isError={isError}
            isEmpty={requests.length === 0}
            emptyMessage="No assistance requests yet."
            loadingMessage="Loading assistance requests..."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Beneficiary</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>REQ-{request.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="font-medium">
                      {request.beneficiary_profiles?.profiles?.full_name?.trim() ||
                        request.beneficiary_profiles?.profiles?.email ||
                        "Unknown beneficiary"}
                    </TableCell>
                    <TableCell>{request.request_type}</TableCell>
                    <TableCell>{formatShortDate(request.request_date)}</TableCell>
                    <TableCell>{formatStatusLabel(request.priority)}</TableCell>
                    <TableCell>
                      <AdminStatusBadge status={requestStatusLabel(request.status)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedId(request.id)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataState>
        </CardContent>
      </DashboardCard>

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        eyebrow="Assistance request"
        title={selected ? `REQ-${selected.id.slice(0, 8).toUpperCase()} · ${selected.request_type}` : ""}
        description={selected ? `Submitted ${formatShortDate(selected.request_date)}` : null}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSelectedId(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={reviewMutation.isPending} onClick={() => reviewMutation.mutate()}>
              {reviewMutation.isPending ? "Saving..." : "Save review"}
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="space-y-6">
            <DetailList
              items={[
                {
                  label: "Beneficiary",
                  value:
                    selected.beneficiary_profiles?.profiles?.full_name ??
                    selected.beneficiary_profiles?.profiles?.email ??
                    "—",
                },
                { label: "Email", value: selected.beneficiary_profiles?.profiles?.email ?? "—" },
                { label: "Priority", value: formatStatusLabel(selected.priority) },
                { label: "Collection area", value: selected.preferred_collection_area ?? "—" },
                { label: "Current status", value: <AdminStatusBadge status={requestStatusLabel(selected.status)} /> },
                { label: "Last reviewed", value: formatShortDate(selected.reviewed_at) },
              ]}
            />
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground">{selected.description}</p>
            </div>
            <label className="block space-y-2 text-sm font-medium text-foreground">
              <span>Status</span>
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value as RequestStatus)}
              >
                {reviewStatuses.map((value) => (
                  <option key={value} value={value}>
                    {requestStatusLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 text-sm font-medium text-foreground">
              <span>Admin notes</span>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
            </label>
          </div>
        ) : null}
      </DetailDrawer>
    </AdminPageShell>
  );
}
