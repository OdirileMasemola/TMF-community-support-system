import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { DetailDrawer, DetailList } from "@/components/shared/DetailDrawer";
import { applicationStatusLabel, formatShortDate } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  createVolunteerAssignment,
  fetchAllApplications,
  updateCampaignApplication,
  type ApplicationWithVolunteer,
} from "@/services/volunteers";

export function AdminVolunteersPage() {
  const queryClient = useQueryClient();
  const { data: applications = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-volunteer-applications"],
    enabled: isSupabaseConfigured(),
    queryFn: () => fetchAllApplications(100),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      application,
      status,
    }: {
      application: ApplicationWithVolunteer;
      status: "approved" | "rejected";
    }) => {
      await updateCampaignApplication(application.id, { status });
      if (status === "approved") {
        await createVolunteerAssignment({
          application_id: application.id,
          volunteer_id: application.volunteer_id,
          campaign_id: application.campaign_id,
          role: application.participation_role || "Volunteer",
          status: "upcoming",
        });
      }
    },
    onSuccess: async (_data, variables) => {
      toast.success(variables.status === "approved" ? "Application approved" : "Application rejected");
      await queryClient.invalidateQueries({ queryKey: ["admin-volunteer-applications"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message || "Could not update application"),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = applications.find((application) => application.id === selectedId) ?? null;

  const totalApplications = applications.length;
  const pendingReview = applications.filter((application) => application.status === "pending").length;
  const approved = applications.filter((application) => application.status === "approved").length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = applications.filter((application) => {
    const submitted = new Date(application.application_date).getTime();
    return !Number.isNaN(submitted) && submitted >= weekAgo;
  }).length;

  return (
    <AdminPageShell
      label="Operations"
      title="Volunteer Management"
      description="Review volunteer applications, approve assignments, and monitor volunteer participation."
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("volunteer-applications")?.scrollIntoView({ behavior: "smooth" })}
        >
          View all applications
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : totalApplications}</p>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Active volunteers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : approved}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">This week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? "—" : `+${thisWeek}`}</p>
          </CardContent>
        </DashboardCard>
      </div>

      <DashboardCard id="volunteer-applications" className="scroll-mt-20">
        <CardHeader>
          <CardTitle>Volunteer applications</CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={isLoading}
            isError={isError}
            isEmpty={applications.length === 0}
            emptyMessage="No volunteer applications found."
            loadingMessage="Loading applications..."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((application) => {
                  const name =
                    application.volunteer_profiles?.profiles?.full_name?.trim() ||
                    application.volunteer_profiles?.profiles?.email ||
                    "Unknown volunteer";

                  return (
                    <TableRow key={application.id}>
                      <TableCell>{application.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell>{application.campaigns?.title ?? "—"}</TableCell>
                      <TableCell>{formatShortDate(application.application_date)}</TableCell>
                      <TableCell>
                        <AdminStatusBadge status={applicationStatusLabel(application.status)} />
                      </TableCell>
                      <TableCell className="text-right">
                        {application.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={reviewMutation.isPending}
                              onClick={() => reviewMutation.mutate({ application, status: "approved" })}
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={reviewMutation.isPending}
                              onClick={() => reviewMutation.mutate({ application, status: "rejected" })}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Button type="button" variant="outline" size="sm" onClick={() => setSelectedId(application.id)}>
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </DataState>
        </CardContent>
      </DashboardCard>

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        eyebrow="Volunteer application"
        title={
          selected?.volunteer_profiles?.profiles?.full_name?.trim() ||
          selected?.volunteer_profiles?.profiles?.email ||
          "Volunteer"
        }
        description={selected?.campaigns?.title ?? null}
        footer={
          selected?.volunteer_profiles?.profiles?.email ? (
            <Button asChild variant="outline">
              <a href={`mailto:${selected.volunteer_profiles.profiles.email}`}>Email volunteer</a>
            </Button>
          ) : null
        }
      >
        {selected ? (
          <DetailList
            items={[
              { label: "Reference", value: selected.id.slice(0, 8) },
              { label: "Email", value: selected.volunteer_profiles?.profiles?.email ?? "—" },
              { label: "Campaign", value: selected.campaigns?.title ?? "—" },
              { label: "Role", value: selected.participation_role ?? "Volunteer" },
              { label: "Submitted", value: formatShortDate(selected.application_date) },
              { label: "Status", value: <AdminStatusBadge status={applicationStatusLabel(selected.status)} /> },
            ]}
          />
        ) : null}
      </DetailDrawer>
    </AdminPageShell>
  );
}
