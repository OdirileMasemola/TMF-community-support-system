import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthCallbackPage } from "@/features/auth/pages/AuthCallbackPage";
import { useAuth } from "@/features/auth/hooks/use-auth";

vi.mock("@/features/auth/hooks/use-auth", () => ({ useAuth: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const createClient = vi.fn();
vi.mock("@/lib/supabaseClient", () => ({ createClient: () => createClient(), getSupabaseClientOrNull: () => null }));

const resendConfirmation = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({ profile: null, isLoading: false, resendConfirmation } as unknown as ReturnType<typeof useAuth>);
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("AuthCallbackPage", () => {
  it("explains an expired verification link and lets the user request a new one", async () => {
    window.history.replaceState(null, "", "/auth/callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired");
    resendConfirmation.mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Your verification link has expired. Please request another one.")).toBeTruthy();
    expect(createClient).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "thandi@company.co.za" } });
    fireEvent.click(screen.getByRole("button", { name: "Resend verification email" }));
    await waitFor(() => expect(resendConfirmation).toHaveBeenCalledWith("thandi@company.co.za"));
    expect(await screen.findByText("We sent you a new verification email.")).toBeTruthy();
    expect((screen.getByRole("button", { name: /resend available in/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows Supabase's resend limit as a friendly message", async () => {
    window.history.replaceState(null, "", "/auth/callback?error=access_denied&error_code=otp_expired");
    resendConfirmation.mockRejectedValue(new Error("email rate limit exceeded"));
    render(
      <MemoryRouter>
        <AuthCallbackPage />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "thandi@company.co.za" } });
    fireEvent.click(screen.getByRole("button", { name: "Resend verification email" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/too many emails/i);
  });
});
