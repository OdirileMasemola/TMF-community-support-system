import { apiData } from "@/lib/apiClient";

/*
 * Admin email domain management. Every call goes through the TMF API, which requires the
 * administrator role and uses the caller's own token, so Supabase RLS (admins only) applies too.
 */

export type RegistrationMode = "open" | "restricted";
export type DomainPolicyType = "approved" | "blocked";
export type DomainStatus = "active" | "inactive";
export type DnsStatus = "unchecked" | "valid" | "invalid" | "error";

export type EmailDomain = {
  id: string;
  domain: string;
  policy_type: DomainPolicyType;
  status: DomainStatus;
  notes: string | null;
  dns_status: DnsStatus;
  dns_checked_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type EmailDomainPolicy = {
  registration_mode: RegistrationMode;
  updated_at: string;
  updated_by: string | null;
};

export type EmailDomainAuditEntry = {
  id: number;
  entity: "domain" | "policy";
  action: "insert" | "update" | "delete";
  domain: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  actor_id: string | null;
  created_at: string;
};

export type EmailDomainFilters = { policy_type?: DomainPolicyType; status?: DomainStatus; search?: string };

export function listEmailDomains(filters: EmailDomainFilters = {}): Promise<EmailDomain[]> {
  const query: Record<string, string> = {};
  if (filters.policy_type) query.policy_type = filters.policy_type;
  if (filters.status) query.status = filters.status;
  if (filters.search?.trim()) query.search = filters.search.trim();
  return apiData<EmailDomain[]>("/api/v1/admin/email-domains", { query });
}

export function addEmailDomain(body: {
  domain: string;
  policy_type: DomainPolicyType;
  status?: DomainStatus;
  notes?: string | null;
}): Promise<EmailDomain> {
  return apiData<EmailDomain>("/api/v1/admin/email-domains", { method: "POST", body });
}

export function updateEmailDomain(
  id: string,
  patch: { policy_type?: DomainPolicyType; status?: DomainStatus; notes?: string | null },
): Promise<EmailDomain> {
  return apiData<EmailDomain>(`/api/v1/admin/email-domains/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
}

export function recheckEmailDomain(id: string): Promise<EmailDomain> {
  return apiData<EmailDomain>(`/api/v1/admin/email-domains/${encodeURIComponent(id)}/dns-check`, { method: "POST" });
}

export async function removeEmailDomain(id: string): Promise<void> {
  await apiData(`/api/v1/admin/email-domains/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function fetchEmailDomainPolicy(): Promise<EmailDomainPolicy> {
  return apiData<EmailDomainPolicy>("/api/v1/admin/email-domain-policy");
}

export function setEmailDomainPolicy(registration_mode: RegistrationMode): Promise<EmailDomainPolicy> {
  return apiData<EmailDomainPolicy>("/api/v1/admin/email-domain-policy", { method: "PUT", body: { registration_mode } });
}

export function listEmailDomainAudit(limit = 50): Promise<EmailDomainAuditEntry[]> {
  return apiData<EmailDomainAuditEntry[]>("/api/v1/admin/email-domain-audit", { query: { limit } });
}
