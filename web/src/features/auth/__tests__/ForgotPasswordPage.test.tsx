import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { useAuth } from "@/features/auth/hooks/useAuth";

// Supabase never loads: the auth context is replaced with plain mocks, so no
// email is ever requested from a real project.
vi.mock("@/features/auth/hooks/useAuth", () => ({ useAuth: vi.fn() }));

const requestPasswordReset = vi.fn();

function renderPage() {
  vi.mocked(useAuth).mockReturnValue({ requestPasswordReset } as unknown as ReturnType<typeof useAuth>);
  return render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

function submit(email?: string) {
  if (email !== undefined) {
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: email } });
  }
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ForgotPasswordPage", () => {
  it("renders the recovery form with a way back to sign in", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /forgot your password\?/i })).toBeTruthy();
    expect(screen.getByLabelText("Email address")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to sign in" }).getAttribute("href")).toBe("/login");
  });

  it("asks for an email address before contacting Supabase", async () => {
    renderPage();
    submit();
    expect(await screen.findByText("Enter your email address.")).toBeTruthy();
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it("rejects a malformed email address", async () => {
    renderPage();
    submit("thandi@");
    expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  it("requests the reset email and shows a neutral confirmation", async () => {
    requestPasswordReset.mockResolvedValue(undefined);
    renderPage();
    // An <input type="email"> strips surrounding whitespace itself; the provider trims again.
    submit("  thandi@example.com ");

    await waitFor(() => expect(requestPasswordReset).toHaveBeenCalledWith("thandi@example.com"));
    expect(await screen.findByText(/If an account exists for that address/)).toBeTruthy();
    expect(screen.getByText("thandi@example.com")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to sign in" }).getAttribute("href")).toBe("/login");
  });

  it("shows a loading state and ignores a second click while sending", async () => {
    let finish: () => void = () => undefined;
    requestPasswordReset.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderPage();
    submit("thandi@example.com");

    const button = await screen.findByRole("button", { name: /sending link/i });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Email address") as HTMLInputElement).disabled).toBe(true);

    fireEvent.click(button);
    expect(requestPasswordReset).toHaveBeenCalledTimes(1);

    finish();
    expect(await screen.findByText(/If an account exists for that address/)).toBeTruthy();
  });

  it("shows a safe error when the request fails and never claims success", async () => {
    requestPasswordReset.mockRejectedValue(new Error("Error sending recovery email"));
    renderPage();
    submit("thandi@example.com");

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "We could not send the email right now. Please try again later or contact the foundation.",
    );
    expect(screen.queryByText(/If an account exists for that address/)).toBeNull();
    expect((screen.getByRole("button", { name: "Send reset link" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("explains rate limiting and network failures", async () => {
    requestPasswordReset.mockRejectedValueOnce(new Error("For security purposes, you can only request this after 60 seconds."));
    renderPage();
    submit("thandi@example.com");
    expect(await screen.findByText(/Too many attempts/)).toBeTruthy();

    requestPasswordReset.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText(/could not reach the server/)).toBeTruthy();
  });
});
