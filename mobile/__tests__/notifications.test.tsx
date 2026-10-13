import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationsScreen } from "@/screens/NotificationsScreen";
import { useNotifications } from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/display";
import { markNotificationRead } from "@/services/notifications";
import { ThemeProvider } from "@/theme/ThemeProvider";

jest.mock("@/hooks/useNotifications", () => ({
  useNotifications: jest.fn(),
  notificationsQueryKey: (userId: string | undefined) => ["notifications", userId],
}));
jest.mock("@/services/notifications", () => ({
  markNotificationRead: jest.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: jest.fn().mockResolvedValue(undefined),
}));
// The icon package ships ESM that Jest does not transform; icons are irrelevant here.
jest.mock("lucide-react-native", () => new Proxy({}, { get: () => () => null }));
const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn() }) }));

const unread = {
  id: "n-1",
  user_id: "u-1",
  title: "Donation verified",
  message: "Your R500 donation to the Food Support Drive was verified.",
  notification_date: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  notification_type: "donation_update",
  status: "unread",
  link_url: "/donor/donations",
  related_entity_type: "donation",
  related_entity_id: "d-1",
};

const readWithNulls = {
  ...unread,
  id: "n-2",
  title: null,
  message: null,
  notification_date: null,
  status: "read",
  link_url: null,
  related_entity_type: null,
};

// Hermes in the release APK has no Intl.RelativeTimeFormat; reproduce that here.
const intl = Intl as unknown as Record<string, unknown>;
const realRelativeTimeFormat = intl.RelativeTimeFormat;
beforeAll(() => {
  delete intl.RelativeTimeFormat;
});
afterAll(() => {
  intl.RelativeTimeFormat = realRelativeTimeFormat;
});

function renderScreen(notifications: unknown[]) {
  (useNotifications as jest.Mock).mockReturnValue({
    userId: "u-1",
    notifications,
    unreadCount: notifications.filter((item) => (item as { status: string }).status === "unread").length,
    query: { isLoading: false, isError: false, isFetching: false, refetch: jest.fn() },
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <NotificationsScreen />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => jest.clearAllMocks());

describe("formatRelativeTime without Intl.RelativeTimeFormat", () => {
  const now = Date.parse("2026-10-13T12:00:00Z");
  it.each([
    ["2026-10-13T11:59:40Z", "just now"],
    ["2026-10-13T11:55:00Z", "5 minutes ago"],
    ["2026-10-13T10:00:00Z", "2 hours ago"],
    ["2026-10-12T12:00:00Z", "yesterday"],
    ["2026-10-10T12:00:00Z", "3 days ago"],
    ["2026-10-13T13:00:00Z", "in 1 hour"],
  ])("formats %s as %s", (value, expected) => {
    expect(formatRelativeTime(value, now)).toBe(expected);
  });

  it("copes with empty and invalid dates", () => {
    expect(formatRelativeTime(null, now)).toBe("—");
    expect(formatRelativeTime("not a date", now)).toBe("not a date");
  });
});

describe("NotificationsScreen", () => {
  it("renders notifications, including rows with null fields, without crashing", () => {
    renderScreen([unread, readWithNulls]);
    expect(screen.getByText("1 unread")).toBeTruthy();
    expect(screen.getByText("Donation verified")).toBeTruthy();
    expect(screen.getByText("Donation Update")).toBeTruthy();
  });

  it("shows the empty state", () => {
    renderScreen([]);
    expect(screen.getByText("No notifications yet.")).toBeTruthy();
  });

  it("opens the full notification and marks it read", async () => {
    renderScreen([unread]);
    fireEvent.press(screen.getByText("Donation verified"));
    expect(await screen.findByText("Open related page")).toBeTruthy();
    expect(screen.getAllByText(unread.message).length).toBeGreaterThan(0);
    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith("n-1"));

    fireEvent.press(screen.getByText("Open related page"));
    expect(mockPush).toHaveBeenCalledWith("/donor/donations");
  });

  it("opens a read notification without marking it again", async () => {
    renderScreen([{ ...unread, status: "read" }]);
    fireEvent.press(screen.getByText("Donation verified"));
    expect(await screen.findByText("Done")).toBeTruthy();
    expect(markNotificationRead).not.toHaveBeenCalled();
  });
});
