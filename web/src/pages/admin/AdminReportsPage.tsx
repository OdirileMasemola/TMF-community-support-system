import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { useRoleProfile } from "@/hooks/useRoleProfile";
import { formatShortDate, formatStatusLabel } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { createReport, fetchReports } from "@/services/admin";

export function AdminReportsPage() {
  const queryClient = useQueryClient();
  const { roleProfileId } = useRoleProfile();

  const { data: reports = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-reports"],
    enabled: isSupabaseConfigured(),
    queryFn: fetchReports,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!roleProfileId) throw new Error("Administrator profile is required to generate a report.");
      const stamp = new Date().toISOString();
      return createReport({
        admin_id: roleProfileId,
        report_name: `System Summary ${stamp.slice(0, 10)}`,
        report_type: "system_summary",
        status: "generated",
        metadata: { generated_via: "admin_reports_page" },
      });
    },
    onSuccess: async () => {
      toast.success("Report generated");
      await queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message || "Could not generate report"),
  });

  return (
    <AdminPageShell
      label="Overview"
      title="Reports"
      description="Generate and export operational reports for users, campaigns, donations, volunteers, and system summaries."
      actions={
        <Button type="button" disabled={generateMutation.isPending} onClick={() => generateMutation.mutate()}>
          {generateMutation.isPending ? "Generating..." : "Generate report"}
        </Button>
      }
    >
      <DataState
        isLoading={isLoading}
        isError={isError}
        isEmpty={reports.length === 0}
        emptyMessage="No reports generated yet."
        loadingMessage="Loading reports..."
      >
        <div className="grid gap-px bg-border lg:grid-cols-2">
          {reports.map((report) => (
            <DashboardCard key={report.id}>
              <CardHeader>
                <CardTitle>{report.report_name}</CardTitle>
                <CardDescription>{formatStatusLabel(report.report_type)}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Last generated: {formatShortDate(report.generated_at)} · {formatStatusLabel(report.status)}
                </p>
                <Button type="button" variant="outline" size="sm" disabled={!report.file_path}>
                  Export
                </Button>
              </CardContent>
            </DashboardCard>
          ))}
        </div>
      </DataState>
    </AdminPageShell>
  );
}
