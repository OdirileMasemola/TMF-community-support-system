import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { RegistrationError } from "@/features/auth/lib/registration";

vi.mock("@/features/auth/hooks/use-auth", () => ({ useAuth: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const signUp = vi.fn();
const resendConfirmation = vi.fn();

function renderPage() {
  vi.mocked(useAuth).mockReturnValue({ signUp, resendConfirmation, signInWithGoogle: vi.fn() } as unknown as ReturnType<typeof useAuth>);
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <RegisterPage />
    </MemoryRouter>,
  );
}

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Thandi Mokoena" } });
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "thandi@company.co.za" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "a-long-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RegisterPage", () => {
  it("shows the API's reason when the email domain is rejected", async () => {
    signUp.mockRejectedValue(new RegistrationError("Registration using this email domain is currently restricted."));
    renderPage();
    fillAndSubmit();
    expect((await screen.findByRole("alert")).textContent).toBe("Registration using this email domain is currently restricted.");
  });

  it("asks the user to check their inbox and offers a resend after a cooldown", async () => {
    signUp.mockResolvedValue({ email: "thandi@company.co.za", needsEmailConfirmation: true, userId: null });
    renderPage();
    fillAndSubmit();
    expect(await screen.findByText("Please check your inbox to verify your email address.")).toBeTruthy();
    expect(screen.getByText("thandi@company.co.za")).toBeTruthy();
    const resend = screen.getByRole("button", { name: /resend available in \d+s/i }) as HTMLButtonElement;
    expect(resend.disabled).toBe(true);
    expect(resendConfirmation).not.toHaveBeenCalled();
  });

  it("passes the form values to signUp", async () => {
    signUp.mockResolvedValue({ email: "thandi@company.co.za", needsEmailConfirmation: true, userId: null });
    renderPage();
    fillAndSubmit();
    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith({
        fullName: "Thandi Mokoena",
        email: "thandi@company.co.za",
        phoneNumber: "",
        password: "a-long-password",
        role: "beneficiary",
      }),
    );
  });
});
