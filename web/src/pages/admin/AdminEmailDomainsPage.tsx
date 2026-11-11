import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DashboardCard } from "@/components/efferd/dashboard-card";
import { DataState } from "@/components/shared/DataState";
import { Button } from "@/components/ui/Button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { isApiError } from "@/lib/apiClient";
import { formatShortDate } from "@/lib/display";
import {
  addEmailDomain,
  fetchEmailDomainPolicy,
  listEmailDomainAudit,
  listEmailDomains,
  recheckEmailDomain,
  removeEmailDomain,
  setEmailDomainPolicy,
  updateEmailDomain,
  type DomainPolicyType,
  type DomainStatus,
  type EmailDomain,
  type EmailDomainFilters,
  type RegistrationMode,
} from "@/services/emailDomains";

const DOMAINS_KEY = ["admin-email-domains"] as const;
const POLICY_KEY = ["admin-email-domain-policy"] as const;
const AUDIT_KEY = ["admin-email-domain-audit"] as const;

const selectClass =
  "rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function adminErrorMessage(error: unknown): string {
  // API errors from these routes carry safe, specific copy (duplicate domain, invalid domain, ...).
  if (isApiError(error) && error.status < 500) return error.message;
  return "Something went wrong. Please try again.";
}

const DNS_LABELS: Record<EmailDomain["dns_status"], string> = {
  unchecked: "Not checked",
  valid: "Receives email",
  invalid: "No mail records",
  error: "Check failed",
};

export function AdminEmailDomainsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<EmailDomainFilters>({});
  const [newDomain, setNewDomain] = useState("");
  const [newPolicy, setNewPolicy] = useState<DomainPolicyType>("approved");
  const [newNotes, setNewNotes] = useState("");
  const [editing, setEditing] = useState<{ id: string; notes: string } | null>(null);

  const domainsQuery = useQuery({ queryKey: [...DOMAINS_KEY, filters], queryFn: () => listEmailDomains(filters) });
  const policyQuery = useQuery({ queryKey: POLICY_KEY, queryFn: fetchEmailDomainPolicy });
  const auditQuery = useQuery({ queryKey: AUDIT_KEY, queryFn: () => listEmailDomainAudit(25) });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: DOMAINS_KEY }),
      queryClient.invalidateQueries({ queryKey: POLICY_KEY }),
      queryClient.invalidateQueries({ queryKey: AUDIT_KEY }),
    ]);
  }

  const onError = (error: unknown) => toast.error(adminErrorMessage(error));

  const addMutation = useMutation({
    mutationFn: () => addEmailDomain({ domain: newDomain, policy_type: newPolicy, notes: newNotes.trim() || null }),
    onSuccess: async (row) => {
      setNewDomain("");
      setNewNotes("");
      toast.success(
        row.dns_status === "valid" ? `${row.domain} added.` : `${row.domain} added. Its mail DNS check: ${DNS_LABELS[row.dns_status]}.`,
      );
      await refresh();
    },
    onError,
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; patch: { policy_type?: DomainPolicyType; status?: DomainStatus; notes?: string | null } }) =>
      updateEmailDomain(input.id, input.patch),
    onSuccess: async () => {
      setEditing(null);
      toast.success("Domain updated.");
      await refresh();
    },
    onError,
  });

  const recheckMutation = useMutation({
    mutationFn: (id: string) => recheckEmailDomain(id),
    onSuccess: async (row) => {
      toast.success(`${row.domain}: ${DNS_LABELS[row.dns_status]}.`);
      await refresh();
    },
    onError,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeEmailDomain(id),
    onSuccess: async () => {
      toast.success("Domain removed.");
      await refresh();
    },
    onError,
  });

  const policyMutation = useMutation({
    mutationFn: (mode: RegistrationMode) => setEmailDomainPolicy(mode),
    onSuccess: async (policy) => {
      toast.success(policy.registration_mode === "open" ? "Registration is open to all deliverable domains." : "Registration is restricted to approved domains.");
      await refresh();
    },
    onError,
  });

  function confirmRemove(row: EmailDomain) {
    if (window.confirm(`Remove ${row.domain}? Existing accounts are not affected.`)) removeMutation.mutate(row.id);
  }

  function changeMode(mode: RegistrationMode) {
    if (mode === "restricted") {
      const approved = (domainsQuery.data ?? []).filter((row) => row.policy_type === "approved" && row.status === "active");
      const warning =
        approved.length === 0
          ? "No active approved domains are listed, so nobody will be able to register with email. Continue?"
          : "Only addresses on active approved domains will be able to register. Continue?";
      if (!window.confirm(warning)) return;
    }
    policyMutation.mutate(mode);
  }

  const domains = domainsQuery.data ?? [];
  const mode = policyQuery.data?.registration_mode;
  const busy = updateMutation.isPending || recheckMutation.isPending || removeMutation.isPending;

  return (
    <AdminPageShell
      label="Administration"
      title="Email Domains"
      description="Control which email domains can be used to register. Every address must still receive and confirm a verification email."
    >
      <DashboardCard>
        <CardHeader>
          <CardTitle>Registration mode</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <DataState isLoading={policyQuery.isLoading} isError={policyQuery.isError} loadingMessage="Loading policy...">
            <fieldset className="grid gap-2" aria-label="Registration mode">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="registration-mode"
                  value="open"
                  checked={mode === "open"}
                  disabled={policyMutation.isPending}
                  onChange={() => changeMode("open")}
                />
                <span>
                  <span className="font-semibold">Open</span> — any domain that can receive email, except blocked domains.
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="registration-mode"
                  value="restricted"
                  checked={mode === "restricted"}
                  disabled={policyMutation.isPending}
                  onChange={() => changeMode("restricted")}
                />
                <span>
                  <span className="font-semibold">Restricted</span> — only active approved domains (and their subdomains).
                </span>
              </label>
            </fieldset>
            <p className="text-xs text-muted-foreground">
              Changes apply to new registrations only. Existing accounts keep working.
            </p>
          </DataState>
        </CardContent>
      </DashboardCard>

      <DashboardCard>
        <CardHeader>
          <CardTitle>Add a domain</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-[2fr_1fr_2fr_auto] md:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              if (newDomain.trim()) addMutation.mutate();
            }}
          >
            <Input
              id="new-email-domain"
              label="Domain"
              placeholder="company.co.za"
              value={newDomain}
              onChange={(event) => setNewDomain(event.target.value)}
              required
            />
            <label className="grid gap-2 text-sm font-medium">
              <span>Policy</span>
              <select className={selectClass} value={newPolicy} onChange={(event) => setNewPolicy(event.target.value as DomainPolicyType)}>
                <option value="approved">Approved</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>
            <Input
              id="new-email-domain-notes"
              label="Notes (optional)"
              maxLength={500}
              value={newNotes}
              onChange={(event) => setNewNotes(event.target.value)}
            />
            <Button type="submit" loading={addMutation.isPending} disabled={addMutation.isPending}>
              Add domain
            </Button>
          </form>
        </CardContent>
      </DashboardCard>

      <DashboardCard>
        <CardHeader>
          <CardTitle>Domains</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex flex-wrap gap-3">
            <Input
              aria-label="Search domains"
              placeholder="Search domains"
              value={filters.search ?? ""}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            />
            <select
              aria-label="Filter by policy"
              className={selectClass}
              value={filters.policy_type ?? ""}
              onChange={(event) =>
                setFilters((current) => ({ ...current, policy_type: (event.target.value || undefined) as DomainPolicyType | undefined }))
              }
            >
              <option value="">All policies</option>
              <option value="approved">Approved</option>
              <option value="blocked">Blocked</option>
            </select>
            <select
              aria-label="Filter by status"
              className={selectClass}
              value={filters.status ?? ""}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: (event.target.value || undefined) as DomainStatus | undefined }))
              }
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <DataState
            isLoading={domainsQuery.isLoading}
            isError={domainsQuery.isError}
            isEmpty={domains.length === 0}
            emptyMessage="No domains listed. In open mode any deliverable domain can register."
            loadingMessage="Loading domains..."
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mail DNS</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.domain}</TableCell>
                      <TableCell>
                        <AdminStatusBadge status={row.policy_type === "approved" ? "Approved" : "Blocked"} />
                      </TableCell>
                      <TableCell>
                        <AdminStatusBadge status={row.status === "active" ? "Active" : "Inactive"} />
                      </TableCell>
                      <TableCell>
                        <span title={row.dns_checked_at ? `Checked ${formatShortDate(row.dns_checked_at)}` : undefined}>
                          {DNS_LABELS[row.dns_status]}
                        </span>
                      </TableCell>
                      <TableCell>{formatShortDate(row.created_at)}</TableCell>
                      <TableCell>{formatShortDate(row.updated_at)}</TableCell>
                      <TableCell className="max-w-[16rem]">
                        {editing?.id === row.id ? (
                          <form
                            className="flex gap-2"
                            onSubmit={(event) => {
                              event.preventDefault();
                              updateMutation.mutate({ id: row.id, patch: { notes: editing.notes.trim() || null } });
                            }}
                          >
                            <Input
                              aria-label={`Notes for ${row.domain}`}
                              maxLength={500}
                              value={editing.notes}
                              onChange={(event) => setEditing({ id: row.id, notes: event.target.value })}
                            />
                            <Button type="submit" size="sm" disabled={busy}>
                              Save
                            </Button>
                          </form>
                        ) : (
                          <span className="text-sm text-muted-foreground">{row.notes ?? "—"}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              updateMutation.mutate({ id: row.id, patch: { status: row.status === "active" ? "inactive" : "active" } })
                            }
                          >
                            {row.status === "active" ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              updateMutation.mutate({
                                id: row.id,
                                patch: { policy_type: row.policy_type === "approved" ? "blocked" : "approved" },
                              })
                            }
                          >
                            {row.policy_type === "approved" ? "Block" : "Approve"}
                          </Button>
                          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setEditing({ id: row.id, notes: row.notes ?? "" })}>
                            Edit notes
                          </Button>
                          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => recheckMutation.mutate(row.id)}>
                            Re-check DNS
                          </Button>
                          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => confirmRemove(row)}>
                            Remove
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DataState>
        </CardContent>
      </DashboardCard>

      <DashboardCard>
        <CardHeader>
          <CardTitle>Recent changes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={auditQuery.isLoading}
            isError={auditQuery.isError}
            isEmpty={(auditQuery.data ?? []).length === 0}
            emptyMessage="No changes recorded yet."
            loadingMessage="Loading audit trail..."
          >
            <ul className="grid gap-2 text-sm">
              {(auditQuery.data ?? []).map((entry) => (
                <li key={entry.id} className="flex flex-wrap justify-between gap-2 border-b border-border pb-2">
                  <span>
                    <span className="font-medium">{entry.entity === "policy" ? "Registration mode" : entry.domain}</span>{" "}
                    {describeAudit(entry.action, entry.old_values, entry.new_values)}
                  </span>
                  <span className="text-muted-foreground">{formatShortDate(entry.created_at)}</span>
                </li>
              ))}
            </ul>
          </DataState>
        </CardContent>
      </DashboardCard>
    </AdminPageShell>
  );
}

function describeAudit(
  action: "insert" | "update" | "delete",
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
): string {
  if (action === "insert") return "added";
  if (action === "delete") return "removed";
  const changed = ["registration_mode", "policy_type", "status", "notes", "dns_status"].filter(
    (key) => (oldValues?.[key] ?? null) !== (newValues?.[key] ?? null),
  );
  if (changed.length === 0) return "updated";
  return changed.map((key) => `${key.replace(/_/g, " ")}: ${String(oldValues?.[key] ?? "—")} → ${String(newValues?.[key] ?? "—")}`).join(", ");
}
