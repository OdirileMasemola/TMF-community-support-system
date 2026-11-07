import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import ResetPasswordScreen from "../app/reset-password";
import { useAuth } from "@/auth/AuthProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";

// Supabase never loads: the auth context is replaced with plain mocks.
jest.mock("@/auth/AuthProvider", () => ({ useAuth: jest.fn(), PASSWORD_RESET_ROUTE: "reset-password" }));

let mockUrl: string | null = null;
jest.mock("expo-linking", () => ({
  useURL: () => mockUrl,
  createURL: (path: string) => `tmfdashboard://${path}`,
}));

const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));

const restoreRecoverySession = jest.fn();
const updatePassword = jest.fn();
const signOut = jest.fn();

// The first render of this screen compiles expo-linking and the UI kit, which
// can exceed Jest's 5 s default when the whole suite runs in parallel.
jest.setTimeout(20_000);

const TOKEN_URL = "tmfdashboard://reset-password#access_token=at&refresh_token=rt&type=recovery";
const EXPIRED_URL =
  "tmfdashboard://reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired";

function renderScreen({ session = null, url = null as string | null, params = {} as Record<string, string> } = {}) {
  mockUrl = url;
  mockParams = params;
  (useAuth as jest.Mock).mockReturnValue({
    session,
    isConfigured: true,
    restoreRecoverySession,
    updatePassword,
    signOut,
  });
  return render(
    <ThemeProvider>
      <ResetPasswordScreen />
    </ThemeProvider>,
  );
}

async function renderReady() {
  renderScreen({ session: { user: { id: "u-1" } } as never });
  await screen.findByPlaceholderText("At least 8 characters");
}

function fillAndSubmit(password: string, confirm: string) {
  fireEvent.changeText(screen.getByPlaceholderText("At least 8 characters"), password);
  fireEvent.changeText(screen.getByPlaceholderText("Type your new password again"), confirm);
  fireEvent.press(screen.getByText("Update password"));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
});

describe("ResetPasswordScreen: handling the deep link", () => {
  it("turns the tokens from the link into a session, then shows the form", async () => {
    restoreRecoverySession.mockResolvedValue(undefined);
    renderScreen({ url: TOKEN_URL });

    await waitFor(() => expect(restoreRecoverySession).toHaveBeenCalledWith({ accessToken: "at", refreshToken: "rt" }));
    expect(await screen.findByText("Choose a new password")).toBeTruthy();
    expect(restoreRecoverySession).toHaveBeenCalledTimes(1);
  });

  it("falls back to the fragment Expo Router exposes as the # param", async () => {
    restoreRecoverySession.mockResolvedValue(undefined);
    renderScreen({ params: { "#": "access_token=at&refresh_token=rt&type=recovery" } });
    await waitFor(() => expect(restoreRecoverySession).toHaveBeenCalledWith({ accessToken: "at", refreshToken: "rt" }));
  });

  it("explains an expired or reused link and offers a new one", async () => {
    renderScreen({ url: EXPIRED_URL });

    expect(await screen.findByText(/expired or has already been used/)).toBeTruthy();
    expect(restoreRecoverySession).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText("At least 8 characters")).toBeNull();

    fireEvent.press(screen.getByText("Request a new link"));
    expect(mockReplace).toHaveBeenCalledWith("/forgot-password");
    fireEvent.press(screen.getByText("Back to sign in"));
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });

  it("explains tokens that Supabase rejects", async () => {
    restoreRecoverySession.mockRejectedValue(new Error("Invalid Refresh Token: Refresh Token Not Found"));
    renderScreen({ url: TOKEN_URL });
    expect(await screen.findByText("This reset link has expired. Please request a new one.")).toBeTruthy();
  });

  it("waits briefly for the opening URL, then treats a bare visit as an invalid link", () => {
    jest.useFakeTimers();
    renderScreen();
    expect(screen.getByText("Checking your reset link…")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(4_000);
    });
    expect(screen.getByText("This reset link is invalid or has expired. Please request a new one.")).toBeTruthy();
  });

  it("ignores an unrelated earlier deep link such as the Google callback", () => {
    jest.useFakeTimers();
    renderScreen({ url: "tmfdashboard://auth/callback#access_token=other&refresh_token=other" });
    act(() => {
      jest.advanceTimersByTime(4_000);
    });
    expect(restoreRecoverySession).not.toHaveBeenCalled();
    expect(screen.getByText(/invalid or has expired/)).toBeTruthy();
  });

  it("shows the form straight away when a session already exists", async () => {
    await renderReady();
    expect(restoreRecoverySession).not.toHaveBeenCalled();
  });
});

describe("ResetPasswordScreen: choosing a new password", () => {
  it("validates the minimum length before calling Supabase", async () => {
    await renderReady();
    fillAndSubmit("short", "short");
    expect(await screen.findByText("Use a password of at least 8 characters.")).toBeTruthy();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("catches a confirmation mismatch", async () => {
    await renderReady();
    fillAndSubmit("community123", "community124");
    expect(await screen.findByText("The passwords do not match.")).toBeTruthy();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("moves from the password to the confirmation with the keyboard", async () => {
    await renderReady();
    expect(screen.getByPlaceholderText("At least 8 characters").props.returnKeyType).toBe("next");
    expect(screen.getByPlaceholderText("Type your new password again").props.returnKeyType).toBe("go");
  });

  it("updates the password, confirms, and signs out to return to sign in", async () => {
    updatePassword.mockResolvedValue(undefined);
    signOut.mockResolvedValue(undefined);
    await renderReady();
    fillAndSubmit("community123", "community123");

    await waitFor(() => expect(updatePassword).toHaveBeenCalledWith("community123"));
    expect(await screen.findByText("Password updated")).toBeTruthy();

    fireEvent.press(screen.getByText("Back to sign in"));
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  it("disables the button while updating and ignores a second submit", async () => {
    let finish: () => void = () => undefined;
    updatePassword.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    await renderReady();
    fillAndSubmit("community123", "community123");

    expect(await screen.findByText("Updating password…")).toBeTruthy();
    fireEvent(screen.getByPlaceholderText("Type your new password again"), "submitEditing");
    expect(updatePassword).toHaveBeenCalledTimes(1);

    finish();
    expect(await screen.findByText("Password updated")).toBeTruthy();
  });

  it("shows Supabase password-policy failures without claiming success", async () => {
    updatePassword.mockRejectedValue(new Error("New password should be different from the old password."));
    await renderReady();
    fillAndSubmit("community123", "community123");

    expect(await screen.findByText(/different from your current password/)).toBeTruthy();
    expect(screen.queryByText("Password updated")).toBeNull();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("offers a way back to sign in from the form", async () => {
    await renderReady();
    fireEvent.press(screen.getByText("Back to sign in"));
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });
});
