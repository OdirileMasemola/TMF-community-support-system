import { fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";
import * as WebBrowser from "expo-web-browser";
import WelcomeScreen from "../app/welcome";
import { PRIVACY_POLICY_URL } from "@/components/welcome/WelcomeInfoLinks";
import { HELP_CONTACT } from "@/data/helpContent";
import { ThemeProvider } from "@/theme/ThemeProvider";

jest.mock("lucide-react-native", () => new Proxy({}, { get: () => () => null }));
const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn() }) }));
jest.mock("expo-web-browser", () => ({ openBrowserAsync: jest.fn(() => Promise.resolve()) }));

function renderWelcome() {
  return render(
    <ThemeProvider>
      <WelcomeScreen />
    </ThemeProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe("WelcomeScreen", () => {
  it("renders without a session or auth context", () => {
    renderWelcome();
    expect(screen.getByText("Together, we can make a difference.")).toBeTruthy();
    expect(screen.getByText("Find Support")).toBeTruthy();
    expect(screen.getByText(/© Themba Molefe Foundation/)).toBeTruthy();
  });

  it("opens the existing login and register screens", () => {
    renderWelcome();
    fireEvent.press(screen.getByText("Sign In"));
    expect(mockPush).toHaveBeenLastCalledWith("/login");
    fireEvent.press(screen.getByText("Create an Account"));
    expect(mockPush).toHaveBeenLastCalledWith("/register");
  });

  it("opens help, contact and privacy destinations", () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    renderWelcome();
    fireEvent.press(screen.getByLabelText("Help & FAQ"));
    expect(mockPush).toHaveBeenLastCalledWith("/help");
    fireEvent.press(screen.getByLabelText("Contact Us"));
    expect(openURL).toHaveBeenCalledWith(`mailto:${HELP_CONTACT.email}`);
    fireEvent.press(screen.getByLabelText("Privacy Policy"));
    expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(PRIVACY_POLICY_URL);
  });
});
