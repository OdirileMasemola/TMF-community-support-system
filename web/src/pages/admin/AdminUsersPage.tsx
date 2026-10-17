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
import { formatShortDate, formatStatusLabel } from "@/lib/display";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchProfiles, updateProfileAccountStatus, type ProfileRow } from "@/services/admin";
import { Skeleton } from "@/components/ui/Spinner";

async function copyRegistrationLink() {
  const link = `${window.location.origin}/register`;
  try {
    await navigator.clipboard.writeText(link);
    toast.success("Registration link copied. Share it with the person you want to invite.");
  } catch {
    toast.info(`Share this registration link: ${link}`);
  }
}


export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ["admin-profiles"],
    enabled: isSupabaseConfigured(),
    queryFn: fetchProfiles,
  });

  const activateMutation = useMutation({
    mutationFn: (userId: string) => updateProfileAccountStatus(userId, "active"),
    onSuccess: async () => {
      toast.success("User activated");
      await queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "Could not activate user");
    },
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = users.find((user) => user.id === selectedId) ?? null;

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: ProfileRow["account_status"] }) =>
      updateProfileAccountStatus(userId, status),
    onSuccess: async (_data, variables) => {
      toast.success(variables.status === "suspended" ? "Account suspended" : "Account activated");
      await queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message || "Could not update account"),
  });

  const totalUsers = users.length;
  const administrators = users.filter((user) => user.role === "administrator").length;
  const volunteers = users.filter((user) => user.role === "volunteer").length;
  const pendingAccounts = users.filter((user) => user.account_status === "pending").length;

  return (
    <AdminPageShell
      label="Administration"
      title="User Management"
      description="View and manage registered platform users, roles, and account status."
      actions={
        <Button type="button" onClick={() => void copyRegistrationLink()}>
          Invite user
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? <Skeleton className="mt-1 h-9 w-20" /> : totalUsers}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? <Skeleton className="mt-1 h-9 w-20" /> : administrators}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Volunteers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? <Skeleton className="mt-1 h-9 w-20" /> : volunteers}</p>
          </CardContent>
        </DashboardCard>
        <DashboardCard>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{isLoading ? <Skeleton className="mt-1 h-9 w-20" /> : pendingAccounts}</p>
          </CardContent>
        </DashboardCard>
      </div>

      <DashboardCard>
        <CardHeader>
          <CardTitle>Registered users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={isLoading}
            isError={isError}
            isEmpty={users.length === 0}
            emptyMessage="No users found."
            loadingMessage="Loading users..."
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{formatStatusLabel(user.role)}</TableCell>
                    <TableCell>
                      <AdminStatusBadge status={formatStatusLabel(user.account_status)} />
                    </TableCell>
                    <TableCell className="text-right">
                      {user.account_status === "pending" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={activateMutation.isPending} loading={activateMutation.isPending && activateMutation.variables === user.id}
                          onClick={() => activateMutation.mutate(user.id)}
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" size="sm" onClick={() => setSelectedId(user.id)}>
                          Manage
                        </Button>
                      )}
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
        eyebrow="Manage user"
        title={selected?.full_name ?? ""}
        description={selected?.email}
        footer={
          selected ? (
            <>
              <Button asChild variant="outline">
                <a href={`mailto:${selected.email}`}>Email user</a>
              </Button>
              {selected.account_status === "active" ? (
                <Button
                  type="button"
                  variant="danger"
                  disabled={statusMutation.isPending} loading={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ userId: selected.id, status: "suspended" })}
                >
                  Suspend account
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={statusMutation.isPending} loading={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ userId: selected.id, status: "active" })}
                >
                  Activate account
                </Button>
              )}
            </>
          ) : null
        }
      >
        {selected ? (
          <DetailList
            items={[
              { label: "Reference", value: selected.id.slice(0, 8) },
              { label: "Role", value: formatStatusLabel(selected.role) },
              { label: "Account", value: <AdminStatusBadge status={formatStatusLabel(selected.account_status)} /> },
              { label: "Phone", value: selected.phone_number ?? "—" },
              { label: "Joined", value: formatShortDate(selected.created_at) },
              { label: "Last updated", value: formatShortDate(selected.updated_at) },
            ]}
          />
        ) : null}
      </DetailDrawer>
    </AdminPageShell>
  );
}
