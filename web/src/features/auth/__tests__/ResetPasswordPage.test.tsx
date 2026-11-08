import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { getSupabaseClientOrNull } from "@/lib/supabaseClient";

vi.mock("@/features/auth/hooks/use-auth", () => ({ useAuth: vi.fn() }));
vi.mock("@/lib/supabaseClient", () => ({ getSupabaseClientOrNull: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const updatePassword = vi.fn();
const signOut = vi.fn();
const getSession = vi.fn();
const exchangeCodeForSession = vi.fn();

const recoverySession = { user: { id: "u-1" }, access_token: "redacted" };

/** Puts the page at the URL Supabase would redirect to, without a real navigation. */
function visit(pathWithParams: string) {
  window.history.replaceState({}, "", pathWithParams);
}

function renderPage() {
  vi.mocked(useAuth).mockReturnValue({ updatePassword, signOut } as unknown as ReturnType<typeof useAuth>);
  vi.mocked(getSupabaseClientOrNull).mockReturnValue({
    auth: { getSession, exchangeCodeForSession },
  } as unknown as ReturnType<typeof getSupabaseClientOrNull>);
  return render(
    <MemoryRouter initialEntries={["/reset-password"]}>
      <ResetPasswordPage />
    </MemoryRouter>,
  );
}

async function renderWithSession() {
  getSession.mockResolvedValue({ data: { session: recoverySession }, error: null });
  visit("/reset-password");
  renderPage();
  await screen.findByLabelText("New password");
}

function fillAndSubmit(password: string, confirm: string) {
  fireEvent.change(screen.getByLabelText("New password"), { target: { value: password } });
  fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: confirm } });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  visit("/");
});

describe("ResetPasswordPage: verifying the link", () => {
  it("shows a checking state while supabase-js reads the URL", () => {
    getSession.mockReturnValue(new Promise(() => undefined));
    visit("/reset-password?code=abc");
    renderPage();
    expect(screen.getByText("Verifying reset link...")).toBeTruthy();
    expect(screen.queryByLabelText("New password")).toBeNull();
  });

  it("explains an expired or already-used link and offers a new one", async () => {
    visit(
      "/reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    );
    renderPage();

    expect(await screen.findByText(/expired or has already been used/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Request a new link" }).getAttribute("href")).toBe("/forgot-password");
    expect(screen.getByRole("link", { name: "Back to sign in" }).getAttribute("href")).toBe("/login");
    expect(getSession).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("New password")).toBeNull();
  });

  it("treats a plain visit with no session as an invalid link", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    visit("/reset-password");
    renderPage();
    expect(await screen.findByText("This reset link is invalid or has expired. Please request a new one.")).toBeTruthy();
  });

  it("tells the user when a PKCE link was opened in a different browser", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: new Error("invalid request: both auth code and code verifier should be non-empty"),
    });
    visit("/reset-password?code=abc-123");
    renderPage();

    expect(await screen.findByText(/same browser/)).toBeTruthy();
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc-123");
  });

  it("shows the form once the code exchange produces a session", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    exchangeCodeForSession.mockResolvedValue({ data: { session: recoverySession }, error: null });
    visit("/reset-password?code=abc-123");
    renderPage();
    expect(await screen.findByLabelText("New password")).toBeTruthy();
  });

  it("does not crash when Supabase is not configured", async () => {
    vi.mocked(useAuth).mockReturnValue({ updatePassword, signOut } as unknown as ReturnType<typeof useAuth>);
    vi.mocked(getSupabaseClientOrNull).mockReturnValue(null);
    visit("/reset-password");
    render(
      <MemoryRouter>
        <ResetPasswordPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText(/temporarily unavailable/)).toBeTruthy();
  });
});

describe("ResetPasswordPage: choosing a new password", () => {
  it("validates the minimum length before calling Supabase", async () => {
    await renderWithSession();
    fillAndSubmit("short", "short");
    expect(await screen.findByText("Use a password of at least 8 characters.")).toBeTruthy();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("catches a confirmation mismatch", async () => {
    await renderWithSession();
    fillAndSubmit("community123", "community124");
    expect(await screen.findByText("The passwords do not match.")).toBeTruthy();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("updates the password, confirms, and signs out on continue", async () => {
    updatePassword.mockResolvedValue(undefined);
    signOut.mockResolvedValue(undefined);
    await renderWithSession();
    fillAndSubmit("community123", "community123");

    await waitFor(() => expect(updatePassword).toHaveBeenCalledWith("community123"));
    expect(await screen.findByRole("heading", { name: /password updated/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Continue to sign in" }));
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  it("disables the form while the update is in flight and ignores a second submit", async () => {
    let finish: () => void = () => undefined;
    updatePassword.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    await renderWithSession();
    fillAndSubmit("community123", "community123");

    const button = await screen.findByRole("button", { name: /updating password/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(updatePassword).toHaveBeenCalledTimes(1);

    finish();
    expect(await screen.findByRole("heading", { name: /password updated/i })).toBeTruthy();
  });

  it("shows Supabase password-policy failures without claiming success", async () => {
    updatePassword.mockRejectedValue(new Error("New password should be different from the old password."));
    await renderWithSession();
    fillAndSubmit("community123", "community123");

    expect(await screen.findByText(/different from your current password/)).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /password updated/i })).toBeNull();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("explains a failed update caused by a lost session or network", async () => {
    updatePassword.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await renderWithSession();
    fillAndSubmit("community123", "community123");
    expect(await screen.findByText(/could not reach the server/)).toBeTruthy();
  });
});
