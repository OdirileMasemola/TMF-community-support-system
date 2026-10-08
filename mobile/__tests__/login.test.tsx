import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import LoginScreen from "../app/login";
import { useAuth } from "@/auth/AuthProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

// Supabase never loads: the auth context is replaced with plain mocks.
jest.mock("@/auth/AuthProvider", () => ({ useAuth: jest.fn() }));
const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn() }) }));

const signIn = jest.fn();
const signInWithGoogle = jest.fn();

function renderLogin() {
  (useAuth as jest.Mock).mockReturnValue({ signIn, signInWithGoogle, isConfigured: true });
  return render(
    <ThemeProvider>
      <LoginScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("LoginScreen", () => {
  it("asks for both fields before signing in", async () => {
    renderLogin();
    fireEvent.press(screen.getByText("Sign in"));
    expect(await screen.findByText("Enter your email address and password.")).toBeTruthy();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("signs in with the trimmed email", async () => {
    signIn.mockResolvedValue(undefined);
    renderLogin();
    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "  thandi@example.com ");
    fireEvent.changeText(screen.getByPlaceholderText("Your password"), "community123");
    fireEvent.press(screen.getByText("Sign in"));
    await waitFor(() => expect(signIn).toHaveBeenCalledWith("thandi@example.com", "community123"));
  });

  it("shows the error Supabase returns", async () => {
    signIn.mockRejectedValue(new Error("Invalid login credentials"));
    renderLogin();
    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "thandi@example.com");
    fireEvent.changeText(screen.getByPlaceholderText("Your password"), "wrong-password");
    fireEvent.press(screen.getByText("Sign in"));
    expect(await screen.findByText("Invalid login credentials")).toBeTruthy();
  });

  it("links to registration, password reset and help", () => {
    renderLogin();
    fireEvent.press(screen.getByText("Create account"));
    fireEvent.press(screen.getByText("Forgot your password?"));
    fireEvent.press(screen.getByText("Read the FAQ"));
    expect(mockPush.mock.calls.map((call) => call[0])).toEqual(["/register", "/forgot-password", "/help"]);
  });
});
