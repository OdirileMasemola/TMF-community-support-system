import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import ForgotPasswordScreen from "../app/forgot-password";
import { useAuth } from "@/auth/AuthProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

// Supabase never loads: the auth context is replaced with plain mocks, so no
// reset email is ever requested from a real project.
jest.mock("@/auth/AuthProvider", () => ({ useAuth: jest.fn() }));
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: mockReplace }) }));

const resetPassword = jest.fn();

function renderScreen() {
  (useAuth as jest.Mock).mockReturnValue({ resetPassword });
  return render(
    <ThemeProvider>
      <ForgotPasswordScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ForgotPasswordScreen", () => {
  it("renders the email form with a way back to sign in", () => {
    renderScreen();
    expect(screen.getByText("Forgot your password?")).toBeTruthy();
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
    fireEvent.press(screen.getByText("Sign in"));
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("asks for an email address before contacting Supabase", async () => {
    renderScreen();
    fireEvent.press(screen.getByText("Send reset link"));
    expect(await screen.findByText("Enter your email address.")).toBeTruthy();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("rejects a malformed email address", async () => {
    renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "thandi@");
    fireEvent.press(screen.getByText("Send reset link"));
    expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it("requests the reset email and shows a neutral confirmation", async () => {
    resetPassword.mockResolvedValue(undefined);
    renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "  thandi@example.com ");
    fireEvent.press(screen.getByText("Send reset link"));

    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith("  thandi@example.com "));
    expect(await screen.findByText("If an account exists for thandi@example.com, a reset email is on its way.")).toBeTruthy();

    fireEvent.press(screen.getByText("Back to sign in"));
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("shows a loading state and ignores a second submit while sending", async () => {
    let finish: () => void = () => undefined;
    resetPassword.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "thandi@example.com");
    fireEvent.press(screen.getByText("Send reset link"));

    expect(await screen.findByText("Sending…")).toBeTruthy();
    fireEvent(screen.getByPlaceholderText("you@example.com"), "submitEditing");
    expect(resetPassword).toHaveBeenCalledTimes(1);

    finish();
    expect(await screen.findByText(/a reset email is on its way/)).toBeTruthy();
  });

  it("explains a failed request and never claims success", async () => {
    resetPassword.mockRejectedValue(new Error("Network request failed"));
    renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "thandi@example.com");
    fireEvent.press(screen.getByText("Send reset link"));

    expect(await screen.findByText("We could not reach the server. Check your connection and try again.")).toBeTruthy();
    expect(screen.queryByText(/a reset email is on its way/)).toBeNull();
  });

  it("lets the user try another address after sending", async () => {
    resetPassword.mockResolvedValue(undefined);
    renderScreen();
    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "thandi@example.com");
    fireEvent.press(screen.getByText("Send reset link"));
    await screen.findByText(/a reset email is on its way/);

    fireEvent.press(screen.getByText("Try a different email"));
    expect(screen.getByPlaceholderText("you@example.com")).toBeTruthy();
  });
});
