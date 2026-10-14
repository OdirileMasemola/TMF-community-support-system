import { act, render, renderHook, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import Index from "../app/index";
import { useAuth } from "@/auth/AuthProvider";
import { useSignOut } from "@/auth/useSignOut";
import { isUserSpecificQuery, useLogoutReset } from "@/navigation/useLogoutReset";
import { ThemeProvider } from "@/theme/ThemeProvider";

jest.mock("@/auth/AuthProvider", () => ({ useAuth: jest.fn() }));
const mockReplace = jest.fn();
const mockDismissAll = jest.fn();
const mockCanDismiss = jest.fn(() => true);
jest.mock("expo-router", () => {
  const { Text: MockText } = require("react-native");
  return {
    Redirect: ({ href }: { href: string }) => <MockText>{`redirect:${href}`}</MockText>,
    useRouter: () => ({ replace: mockReplace, dismissAll: mockDismissAll, canDismiss: mockCanDismiss, push: jest.fn() }),
  };
});

const session = { user: { id: "u-1" } } as never;

function renderIndex(auth: object) {
  (useAuth as jest.Mock).mockReturnValue({ session: null, profile: null, profileError: null, isLoading: false, ...auth });
  return render(
    <ThemeProvider>
      <Index />
    </ThemeProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe("launch routing (app/index)", () => {
  it("shows the neutral splash, never dashboard wording, while the session is restored", () => {
    renderIndex({ isLoading: true });
    expect(screen.getByText("Themba Molefe Foundation")).toBeTruthy();
    expect(screen.queryByText(/dashboard/i)).toBeNull();
    expect(screen.queryByText(/redirect:/)).toBeNull();
  });

  it("sends a launch with no (or an expired, already-cleared) session to welcome", () => {
    renderIndex({});
    expect(screen.getByText("redirect:/welcome")).toBeTruthy();
  });

  it("restores a valid session straight into the role's portal", () => {
    renderIndex({ session, profile: { role: "donor" } });
    expect(screen.getByText("redirect:/donor/dashboard")).toBeTruthy();
  });

  it("sends a session without a profile row to complete-profile", () => {
    renderIndex({ session });
    expect(screen.getByText("redirect:/complete-profile")).toBeTruthy();
  });

  it("does not route anywhere when the profile read failed", () => {
    renderIndex({ session, profileError: "boom" });
    expect(screen.queryByText(/redirect:/)).toBeNull();
  });
});

describe("useLogoutReset", () => {
  function setup() {
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    client.setQueryData(["donor", "donations", "rp-1"], [1]);
    client.setQueryData(["notifications", "u-1"], [1]);
    client.setQueryData(["campaigns", "public"], [1]);
    const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    const hook = renderHook(({ s, loading, pub }: { s: never; loading: boolean; pub: boolean }) => useLogoutReset(s, loading, pub), {
      wrapper,
      initialProps: { s: null as never, loading: true, pub: false },
    });
    return { client, hook };
  }

  it("does nothing on a first launch without a session", () => {
    const { hook } = setup();
    hook.rerender({ s: null as never, loading: false, pub: false });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("clears user data and resets the stack to welcome when the session ends", () => {
    const { client, hook } = setup();
    hook.rerender({ s: session, loading: false, pub: false });
    expect(mockReplace).not.toHaveBeenCalled();
    hook.rerender({ s: null as never, loading: false, pub: false });
    expect(mockDismissAll).toHaveBeenCalledTimes(1);
    // On a portal screen the root gate does the one replace, so the hook must not.
    expect(mockReplace).not.toHaveBeenCalled();
    expect(client.getQueryData(["donor", "donations", "rp-1"])).toBeUndefined();
    expect(client.getQueryData(["notifications", "u-1"])).toBeUndefined();
    expect(client.getQueryData(["campaigns", "public"])).toEqual([1]);
  });

  it("replaces to welcome itself when signed out on a public screen", () => {
    const { hook } = setup();
    hook.rerender({ s: session, loading: false, pub: true });
    hook.rerender({ s: null as never, loading: false, pub: true });
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/welcome");
  });

  it("keeps public campaign lists only", () => {
    expect(isUserSpecificQuery({ queryKey: ["campaigns", "active"] })).toBe(false);
    expect(isUserSpecificQuery({ queryKey: ["role-profile", "donor", "u-1"] })).toBe(true);
  });
});

describe("useSignOut", () => {
  it("shows an alert and stays put when sign-out fails", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const signOut = jest.fn().mockRejectedValue(new Error("Network request failed"));
    (useAuth as jest.Mock).mockReturnValue({ signOut });
    const { result } = renderHook(() => useSignOut());
    await act(() => result.current());
    expect(signOut).toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith("Could not sign out", expect.stringContaining("Network request failed"));
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

