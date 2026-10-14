import { render, screen } from "@testing-library/react-native";
import { Dimensions } from "react-native";
import WelcomeScreen from "../app/welcome";
import { ThemeProvider } from "@/theme/ThemeProvider";

jest.mock("lucide-react-native", () => new Proxy({}, { get: () => () => null }));
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }) }));

it("renders every action inside a scroll view on a small 320x568 phone", () => {
  jest.spyOn(Dimensions, "get").mockReturnValue({ width: 320, height: 568, scale: 2, fontScale: 1.3 });
  const { UNSAFE_getByType } = render(
    <ThemeProvider>
      <WelcomeScreen />
    </ThemeProvider>,
  );
  const { ScrollView } = require("react-native");
  expect(UNSAFE_getByType(ScrollView)).toBeTruthy();
  for (const label of ["Sign In", "Create an Account", "Help & FAQ", "Contact Us", "Privacy Policy"]) {
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  }
});
