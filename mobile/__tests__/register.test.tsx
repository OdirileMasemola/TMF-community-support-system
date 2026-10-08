import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import RegisterScreen from "../app/register";
import { useAuth } from "@/auth/AuthProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

// Supabase never loads: the auth context is replaced with plain mocks.
jest.mock("@/auth/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));

const signUp = jest.fn();
const signInWithGoogle = jest.fn();

function renderRegister() {
  (useAuth as jest.Mock).mockReturnValue({ signUp, signInWithGoogle });
  return render(
    <ThemeProvider>
      <RegisterScreen />
    </ThemeProvider>,
  );
}

function fillForm({ password = "community123", confirm = "community123" } = {}) {
  fireEvent.changeText(screen.getByPlaceholderText("Your full name"), "Thandi Mokoena");
  fireEvent.changeText(screen.getByPlaceholderText("you@example.com"), "thandi@example.com");
  fireEvent.changeText(screen.getByPlaceholderText("e.g. 072 000 0000"), "072 000 0000");
  fireEvent.changeText(screen.getByPlaceholderText("At least 8 characters"), password);
  fireEvent.changeText(screen.getByPlaceholderText("Type your password again"), confirm);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("RegisterScreen", () => {
  it("shows the first problem and does not call Supabase", async () => {
    renderRegister();
    fireEvent.press(screen.getByText("Create account"));
    expect(await screen.findByText("Enter your full name.")).toBeTruthy();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("needs a role to be chosen", async () => {
    renderRegister();
    fillForm();
    fireEvent.press(screen.getByText("Create account"));
    expect(await screen.findByText("Choose how you are joining TMF.")).toBeTruthy();
  });

  it("catches passwords that do not match", async () => {
    renderRegister();
    fillForm({ confirm: "community124" });
    fireEvent.press(screen.getByText("Donor"));
    fireEvent.press(screen.getByText("Create account"));
    expect(await screen.findByText("The passwords do not match.")).toBeTruthy();
    expect(signUp).not.toHaveBeenCalled();
  });

  it("asks sponsors for their organisation", async () => {
    renderRegister();
    fillForm();
    fireEvent.press(screen.getByText("Sponsor"));
    fireEvent.press(screen.getByText("Create account"));
    expect(await screen.findByText("Enter your organisation's name.")).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText("Your business or organisation"), "Sipho Holdings");
    signUp.mockResolvedValue({ needsEmailConfirmation: false });
    fireEvent.press(screen.getByText("Create account"));
    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith(
        expect.objectContaining({ role: "sponsor", organisationName: "Sipho Holdings" }),
      ),
    );
  });

  it("tells the user to check their email when confirmation is on", async () => {
    signUp.mockResolvedValue({ needsEmailConfirmation: true });
    renderRegister();
    fillForm();
    fireEvent.press(screen.getByText("Volunteer"));
    fireEvent.press(screen.getByText("Create account"));
    expect(await screen.findByText("Check your email")).toBeTruthy();
    expect(signUp).toHaveBeenCalledWith({
      fullName: "Thandi Mokoena",
      email: "thandi@example.com",
      phoneNumber: "072 000 0000",
      password: "community123",
      role: "volunteer",
      organisationName: "",
    });
  });

  it("explains the Google sign-up rule", () => {
    renderRegister();
    expect(
      screen.getByText(
        "Signing up with Google creates a beneficiary account. An administrator can change your role afterwards.",
      ),
    ).toBeTruthy();
  });
});
