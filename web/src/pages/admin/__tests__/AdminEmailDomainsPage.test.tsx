import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminEmailDomainsPage } from "@/pages/admin/AdminEmailDomainsPage";
import * as service from "@/services/emailDomains";
import { navGroups } from "@/components/app-shell/app-shared";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/services/emailDomains", () => ({
  listEmailDomains: vi.fn(),
  addEmailDomain: vi.fn(),
  updateEmailDomain: vi.fn(),
  recheckEmailDomain: vi.fn(),
  removeEmailDomain: vi.fn(),
  fetchEmailDomainPolicy: vi.fn(),
  setEmailDomainPolicy: vi.fn(),
  listEmailDomainAudit: vi.fn(),
}));

const row: service.EmailDomain = {
  id: "11111111-1111-4111-8111-111111111111",
  domain: "company.co.za",
  policy_type: "approved",
  status: "active",
  notes: "Partner NGO",
  dns_status: "valid",
  dns_checked_at: "2026-11-12T08:00:00Z",
  created_at: "2026-11-10T08:00:00Z",
  updated_at: "2026-11-11T08:00:00Z",
  created_by: null,
  updated_by: null,
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AdminEmailDomainsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(service.listEmailDomains).mockResolvedValue([row]);
  vi.mocked(service.fetchEmailDomainPolicy).mockResolvedValue({ registration_mode: "open", updated_at: row.updated_at, updated_by: null });
  vi.mocked(service.listEmailDomainAudit).mockResolvedValue([
    { id: 1, entity: "domain", action: "insert", domain: "company.co.za", old_values: null, new_values: {}, actor_id: null, created_at: row.created_at },
  ]);
});

describe("AdminEmailDomainsPage", () => {
  it("is linked from the Administration navigation", () => {
    const admin = navGroups.flatMap((group) => group.items).find((item) => item.path === "/admin/email-domains");
    expect(admin?.title).toBe("Email Domains");
  });

  it("lists domains with policy, status and DNS status, and shows the current mode", async () => {
    renderPage();
    expect(await screen.findByText("company.co.za", { selector: "td" })).toBeTruthy();
    expect(screen.getByText("Approved", { selector: "span" })).toBeTruthy();
    expect(screen.getByText("Active", { selector: "span" })).toBeTruthy();
    expect(screen.getByText("Receives email")).toBeTruthy();
    await waitFor(() => expect((screen.getByDisplayValue("open") as HTMLInputElement).checked).toBe(true));
    expect(await screen.findByText(/added/)).toBeTruthy();
  });

  it("adds a domain", async () => {
    vi.mocked(service.addEmailDomain).mockResolvedValue({ ...row, id: "2", domain: "blocked.example", policy_type: "blocked" });
    renderPage();
    fireEvent.change(screen.getByLabelText("Domain"), { target: { value: "Blocked.Example" } });
    fireEvent.change(screen.getByLabelText("Policy"), { target: { value: "blocked" } });
    fireEvent.click(screen.getByRole("button", { name: "Add domain" }));
    await waitFor(() =>
      expect(service.addEmailDomain).toHaveBeenCalledWith({ domain: "Blocked.Example", policy_type: "blocked", notes: null }),
    );
  });

  it("deactivates, blocks, re-checks and removes a domain", async () => {
    vi.mocked(service.updateEmailDomain).mockResolvedValue(row);
    vi.mocked(service.recheckEmailDomain).mockResolvedValue(row);
    vi.mocked(service.removeEmailDomain).mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage();
    await screen.findByText("company.co.za", { selector: "td" });

    fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));
    await waitFor(() => expect(service.updateEmailDomain).toHaveBeenCalledWith(row.id, { status: "inactive" }));

    fireEvent.click(await screen.findByRole("button", { name: "Block" }));
    await waitFor(() => expect(service.updateEmailDomain).toHaveBeenCalledWith(row.id, { policy_type: "blocked" }));

    fireEvent.click(await screen.findByRole("button", { name: "Re-check DNS" }));
    await waitFor(() => expect(service.recheckEmailDomain).toHaveBeenCalledWith(row.id));

    fireEvent.click(await screen.findByRole("button", { name: "Remove" }));
    await waitFor(() => expect(service.removeEmailDomain).toHaveBeenCalledWith(row.id));
  });

  it("asks for confirmation before switching to restricted mode", async () => {
    vi.mocked(service.setEmailDomainPolicy).mockResolvedValue({ registration_mode: "restricted", updated_at: row.updated_at, updated_by: null });
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderPage();
    await screen.findByText("company.co.za", { selector: "td" });
    const restricted = await screen.findByDisplayValue("restricted");

    fireEvent.click(restricted);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(service.setEmailDomainPolicy).not.toHaveBeenCalled();

    fireEvent.click(restricted);
    await waitFor(() => expect(service.setEmailDomainPolicy).toHaveBeenCalledWith("restricted"));
  });
});
