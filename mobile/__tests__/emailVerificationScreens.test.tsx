import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import RegisterScreen from "../app/register";
import LoginScreen from "../app/login";
import AuthCallbackScreen from "../app/auth/callback";
import { useAuth } from "@/auth/AuthProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

jest.mock("@/auth/AuthProvider", () => ({ useAuth: jest.fn() }));
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

const signUp = jest.fn();
const signIn = jest.fn();
const resendConfirmation = jest.fn();

function withTheme(node: React.ReactElement) {
  (useAuth as jest.Mock).mockReturnValue({
    signUp,
    signIn,
    resendConfirmation,
    signInWithGoogle: jest.fn(),
    isConfigured: true,
    session: null,
  });
  return render(<ThemeProvider>{node}</ThemeProvider>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
});

describe("email verification screens", () => {
  it("register: shows the API's rejection and does not show the inbox card", async () => {
    signUp.mockRejectedValue(new Error("This email domain is not configured to receive email."));
    withTheme(<RegisterScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("Your full name"), "Thandi Mokoena");
    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "thandi@nomail.example");
    fireEvent.changeText(screen.getByPlaceholderText("At least 8 characters"), "community123");
    fireEvent.changeText(screen.getByPlaceholderText("Type your password again"), "community123");
    fireEvent.press(screen.getByText("Volunteer"));
    fireEvent.press(screen.getByText("Create account"));
    expect(await screen.findByText("This email domain is not configured to receive email.")).toBeTruthy();
    expect(screen.queryByText("Check your email")).toBeNull();
  });

  it("register: the inbox card shows the normalised address and a resend button on cooldown", async () => {
    signUp.mockResolvedValue({ needsEmailConfirmation: true, email: "thandi@company.co.za" });
    withTheme(<RegisterScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("Your full name"), "Thandi Mokoena");
    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "Thandi@Company.co.za");
    fireEvent.changeText(screen.getByPlaceholderText("At least 8 characters"), "community123");
    fireEvent.changeText(screen.getByPlaceholderText("Type your password again"), "community123");
    fireEvent.press(screen.getByText("Volunteer"));
    fireEvent.press(screen.getByText("Create account"));
    expect(await screen.findByText(/Please check your inbox to verify your email address\..*thandi@company\.co\.za/s)).toBeTruthy();
    expect(screen.getByText(/Resend available in \d+s/)).toBeTruthy();
    fireEvent.press(screen.getByText(/Resend available in/));
    expect(resendConfirmation).not.toHaveBeenCalled();
  });

  it("login: an unconfirmed address gets a resend option", async () => {
    signIn.mockRejectedValue(new Error("Email not confirmed"));
    resendConfirmation.mockResolvedValue(undefined);
    withTheme(<LoginScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "thandi@company.co.za");
    fireEvent.changeText(screen.getByPlaceholderText("Your password"), "community123");
    fireEvent.press(screen.getByText("Sign in"));
    expect(await screen.findByText("Please check your inbox to verify your email address.")).toBeTruthy();
    fireEvent.press(screen.getByText("Resend verification email"));
    await waitFor(() => expect(resendConfirmation).toHaveBeenCalledWith("thandi@company.co.za"));
    expect(await screen.findByText("We sent you a new verification email.")).toBeTruthy();
  });

  it("callback: an expired link explains itself and offers a resend", async () => {
    mockParams = { error: "access_denied", error_code: "otp_expired", error_description: "Email link is invalid or has expired" };
    resendConfirmation.mockResolvedValue(undefined);
    withTheme(<AuthCallbackScreen />);
    expect(screen.getByText("Your verification link has expired. Please request another one.")).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "thandi@company.co.za");
    fireEvent.press(screen.getByText("Resend verification email"));
    await waitFor(() => expect(resendConfirmation).toHaveBeenCalledWith("thandi@company.co.za"));
  });
});
